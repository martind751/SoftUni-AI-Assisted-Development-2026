package server

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"soundscraibe/internal/spotify"
	"soundscraibe/internal/user"

	"github.com/gin-gonic/gin"
)

func (h *handlers) Library(c *gin.Context) {
	u, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}
	currentUser := u.(*user.User)

	// Parse query params
	entityType := c.Query("entity_type")
	shelf := c.Query("shelf")
	tag := c.Query("tag")
	minRatingStr := c.Query("min_rating")
	sort := c.DefaultQuery("sort", "rating_desc")
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "20")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	ctx := c.Request.Context()

	// Build dynamic query
	// Base: entities from entity_metadata that the user has interacted with (rating, shelf, or tag)
	args := []interface{}{currentUser.ID}
	argN := 1

	whereFilters := []string{}

	// Entity type filter
	if entityType != "" && validEntityType(entityType) {
		argN++
		whereFilters = append(whereFilters, fmt.Sprintf("em.entity_type = $%d", argN))
		args = append(args, entityType)
	}

	// Shelf filter
	if shelf != "" && validShelfStatus(shelf) {
		argN++
		whereFilters = append(whereFilters, fmt.Sprintf("s.status = $%d", argN))
		args = append(args, shelf)
	}

	// Rated filter
	rated := c.Query("rated")
	if rated == "true" {
		whereFilters = append(whereFilters, "r.score IS NOT NULL")
	}

	// Min rating filter
	if minRatingStr != "" {
		if minRating, err := strconv.Atoi(minRatingStr); err == nil && minRating >= 1 && minRating <= 10 {
			argN++
			whereFilters = append(whereFilters, fmt.Sprintf("r.score >= $%d", argN))
			args = append(args, minRating)
		}
	}

	// Tag filter (use EXISTS subquery to avoid duplicates from the join)
	if tag != "" {
		argN++
		whereFilters = append(whereFilters, fmt.Sprintf(
			`EXISTS (SELECT 1 FROM item_tags it JOIN tags t ON t.id = it.tag_id WHERE it.user_id = $1 AND it.entity_type = em.entity_type AND it.entity_id = em.entity_id AND t.name = $%d)`, argN))
		args = append(args, tag)
	}

	// The user must have at least one interaction
	interactionFilter := "(r.id IS NOT NULL OR s.id IS NOT NULL OR EXISTS (SELECT 1 FROM item_tags it2 WHERE it2.user_id = $1 AND it2.entity_type = em.entity_type AND it2.entity_id = em.entity_id))"

	whereClause := "WHERE " + interactionFilter
	for _, f := range whereFilters {
		whereClause += " AND " + f
	}

	// Sort
	orderBy := "ORDER BY "
	switch sort {
	case "name_asc":
		orderBy += "em.name ASC"
	case "recent":
		orderBy += "em.updated_at DESC"
	default: // rating_desc
		orderBy += "COALESCE(r.score, 0) DESC, em.name ASC"
	}

	baseQuery := fmt.Sprintf(
		`FROM entity_metadata em
		 LEFT JOIN ratings r ON r.user_id = $1 AND r.entity_type = em.entity_type AND r.entity_id = em.entity_id
		 LEFT JOIN shelves s ON s.user_id = $1 AND s.entity_type = em.entity_type AND s.entity_id = em.entity_id
		 %s`,
		whereClause,
	)

	// Count total
	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(DISTINCT (em.entity_type, em.entity_id)) %s", baseQuery)
	err = h.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		log.Printf("failed to count library items for user %d: %v", currentUser.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load library"})
		return
	}

	// Fetch items
	argN++
	limitPlaceholder := fmt.Sprintf("$%d", argN)
	args = append(args, limit)
	argN++
	offsetPlaceholder := fmt.Sprintf("$%d", argN)
	args = append(args, offset)

	dataQuery := fmt.Sprintf(
		`SELECT em.entity_type, em.entity_id, em.name, em.image_url, em.extra_json,
		   r.score, s.status
		 %s
		 %s
		 LIMIT %s OFFSET %s`,
		baseQuery, orderBy, limitPlaceholder, offsetPlaceholder,
	)

	rows, err := h.db.QueryContext(ctx, dataQuery, args...)
	if err != nil {
		log.Printf("failed to query library items for user %d: %v", currentUser.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load library"})
		return
	}
	defer rows.Close()

	type libraryItem struct {
		EntityType string      `json:"entity_type"`
		EntityID   string      `json:"entity_id"`
		Name       string      `json:"name"`
		ImageURL   string      `json:"image_url"`
		Rating     *int        `json:"rating"`
		Shelf      *string     `json:"shelf"`
		Tags       []string    `json:"tags"`
		Extra      interface{} `json:"extra"`
	}

	items := []libraryItem{}
	for rows.Next() {
		var item libraryItem
		var extraJSON []byte
		if err := rows.Scan(&item.EntityType, &item.EntityID, &item.Name, &item.ImageURL, &extraJSON, &item.Rating, &item.Shelf); err != nil {
			log.Printf("failed to scan library item: %v", err)
			continue
		}

		// Parse extra_json
		var extra interface{}
		if err := json.Unmarshal(extraJSON, &extra); err == nil {
			item.Extra = extra
		} else {
			item.Extra = gin.H{}
		}

		// Fetch tags for this item
		tagRows, err := h.db.QueryContext(ctx,
			`SELECT t.name FROM item_tags it JOIN tags t ON t.id = it.tag_id
			 WHERE it.user_id = $1 AND it.entity_type = $2 AND it.entity_id = $3`,
			currentUser.ID, item.EntityType, item.EntityID,
		)
		item.Tags = []string{}
		if err == nil {
			for tagRows.Next() {
				var tagName string
				if err := tagRows.Scan(&tagName); err == nil {
					item.Tags = append(item.Tags, tagName)
				}
			}
			tagRows.Close()
		}

		items = append(items, item)
	}

	c.JSON(http.StatusOK, gin.H{
		"items": items,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// fetchCovers runs a query that returns a single image_url column and collects the results.
func (h *handlers) fetchCovers(ctx context.Context, query string, args ...interface{}) []string {
	rows, err := h.db.QueryContext(ctx, query, args...)
	if err != nil {
		return []string{}
	}
	defer rows.Close()

	var covers []string
	for rows.Next() {
		var url string
		if err := rows.Scan(&url); err == nil && url != "" {
			covers = append(covers, url)
		}
	}
	if covers == nil {
		covers = []string{}
	}
	return covers
}

// LibrarySummary returns item counts and recent cover art for each library group.
func (h *handlers) LibrarySummary(c *gin.Context) {
	u, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}
	currentUser := u.(*user.User)

	entityType := c.Query("entity_type")

	ctx := c.Request.Context()

	var rated, onRotation, wantToListen int
	countArgs := []interface{}{currentUser.ID}
	entityFilter := ""
	if entityType != "" && validEntityType(entityType) {
		entityFilter = " AND em.entity_type = $2"
		countArgs = append(countArgs, entityType)
	}

	err := h.db.QueryRowContext(ctx, fmt.Sprintf(`
		SELECT
			COUNT(DISTINCT CASE WHEN r.score IS NOT NULL THEN (em.entity_type, em.entity_id) END) AS rated,
			COUNT(DISTINCT CASE WHEN s.status = 'on_rotation' THEN (em.entity_type, em.entity_id) END) AS on_rotation,
			COUNT(DISTINCT CASE WHEN s.status = 'want_to_listen' THEN (em.entity_type, em.entity_id) END) AS want_to_listen
		FROM entity_metadata em
		LEFT JOIN ratings r ON r.user_id = $1 AND r.entity_type = em.entity_type AND r.entity_id = em.entity_id
		LEFT JOIN shelves s ON s.user_id = $1 AND s.entity_type = em.entity_type AND s.entity_id = em.entity_id
		WHERE (r.id IS NOT NULL OR s.id IS NOT NULL OR EXISTS (SELECT 1 FROM item_tags it WHERE it.user_id = $1 AND it.entity_type = em.entity_type AND it.entity_id = em.entity_id))%s
	`, entityFilter), countArgs...).Scan(&rated, &onRotation, &wantToListen)
	if err != nil {
		log.Printf("failed to query library summary for user %d: %v", currentUser.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load library summary"})
		return
	}

	// Fetch recent covers for each DB-backed group
	ratedCoverArgs := []interface{}{currentUser.ID}
	if entityType != "" && validEntityType(entityType) {
		ratedCoverArgs = append(ratedCoverArgs, entityType)
	}
	ratedCovers := h.fetchCovers(ctx, fmt.Sprintf(`
		SELECT em.image_url
		FROM entity_metadata em
		JOIN ratings r ON r.user_id = $1 AND r.entity_type = em.entity_type AND r.entity_id = em.entity_id
		WHERE r.score IS NOT NULL%s
		ORDER BY r.updated_at DESC
		LIMIT 4
	`, entityFilter), ratedCoverArgs...)

	onRotationCoverArgs := []interface{}{currentUser.ID}
	if entityType != "" && validEntityType(entityType) {
		onRotationCoverArgs = append(onRotationCoverArgs, entityType)
	}
	onRotationCovers := h.fetchCovers(ctx, fmt.Sprintf(`
		SELECT em.image_url
		FROM entity_metadata em
		JOIN shelves s ON s.user_id = $1 AND s.entity_type = em.entity_type AND s.entity_id = em.entity_id
		WHERE s.status = 'on_rotation'%s
		ORDER BY s.updated_at DESC
		LIMIT 4
	`, entityFilter), onRotationCoverArgs...)

	wantToListenCoverArgs := []interface{}{currentUser.ID}
	if entityType != "" && validEntityType(entityType) {
		wantToListenCoverArgs = append(wantToListenCoverArgs, entityType)
	}
	wantToListenCovers := h.fetchCovers(ctx, fmt.Sprintf(`
		SELECT em.image_url
		FROM entity_metadata em
		JOIN shelves s ON s.user_id = $1 AND s.entity_type = em.entity_type AND s.entity_id = em.entity_id
		WHERE s.status = 'want_to_listen'%s
		ORDER BY s.updated_at DESC
		LIMIT 4
	`, entityFilter), wantToListenCoverArgs...)

	// Favorites: filter by entity_type when set
	favorites := 0
	favCovers := []string{}

	switch entityType {
	case "track", "":
		// When "track" or no filter, always include tracks
		if resp, err := spotify.GetSavedTracks(ctx, currentUser.AccessToken, 4, 0); err == nil {
			favorites += resp.Total
			for _, item := range resp.Items {
				if len(item.Track.Album.Images) > 0 {
					favCovers = append(favCovers, item.Track.Album.Images[0].URL)
				}
			}
		}
		if entityType == "" {
			// No filter = include all types
			if resp, err := spotify.GetSavedAlbums(ctx, currentUser.AccessToken, 1, 0); err == nil {
				favorites += resp.Total
			}
			if resp, err := spotify.GetFollowedArtists(ctx, currentUser.AccessToken, 1, ""); err == nil {
				favorites += resp.Total
			}
		}
	case "album":
		if resp, err := spotify.GetSavedAlbums(ctx, currentUser.AccessToken, 4, 0); err == nil {
			favorites += resp.Total
			for _, item := range resp.Items {
				if len(item.Album.Images) > 0 {
					favCovers = append(favCovers, item.Album.Images[0].URL)
				}
			}
		}
	case "artist":
		if resp, err := spotify.GetFollowedArtists(ctx, currentUser.AccessToken, 4, ""); err == nil {
			favorites += resp.Total
			for _, item := range resp.Items {
				if item.ImageURL() != "" {
					favCovers = append(favCovers, item.ImageURL())
				}
			}
		}
	}

	if favCovers == nil {
		favCovers = []string{}
	}

	type groupSummary struct {
		Count  int      `json:"count"`
		Covers []string `json:"covers"`
	}

	c.JSON(http.StatusOK, gin.H{
		"rated":          groupSummary{Count: rated, Covers: ratedCovers},
		"on_rotation":    groupSummary{Count: onRotation, Covers: onRotationCovers},
		"want_to_listen": groupSummary{Count: wantToListen, Covers: wantToListenCovers},
		"favorites":      groupSummary{Count: favorites, Covers: favCovers},
	})
}
