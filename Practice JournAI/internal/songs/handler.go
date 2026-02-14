package songs

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
)

type ErrorResponse struct {
	Error string `json:"error"`
}

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) List(c *gin.Context) {
	genre := c.Query("genre")
	orderBy := c.Query("order_by")
	orderDir := c.Query("order_dir")

	songs, err := h.service.List(c.Request.Context(), genre, orderBy, orderDir)
	if err != nil {
		status := mapErrorToStatus(err)
		c.JSON(status, ErrorResponse{Error: err.Error()})
		return
	}
	c.JSON(http.StatusOK, songs)
}

func (h *Handler) GetByID(c *gin.Context) {
	id := c.Param("id")
	song, err := h.service.GetByID(c.Request.Context(), id)
	if err != nil {
		status := mapErrorToStatus(err)
		c.JSON(status, ErrorResponse{Error: err.Error()})
		return
	}
	c.JSON(http.StatusOK, song)
}

func (h *Handler) Create(c *gin.Context) {
	var req CreateSongRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}
	song, err := h.service.Create(c.Request.Context(), req)
	if err != nil {
		status := mapErrorToStatus(err)
		c.JSON(status, ErrorResponse{Error: err.Error()})
		return
	}
	c.JSON(http.StatusCreated, song)
}

func (h *Handler) Update(c *gin.Context) {
	id := c.Param("id")
	var req UpdateSongRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}
	song, err := h.service.Update(c.Request.Context(), id, req)
	if err != nil {
		status := mapErrorToStatus(err)
		c.JSON(status, ErrorResponse{Error: err.Error()})
		return
	}
	c.JSON(http.StatusOK, song)
}

func (h *Handler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := h.service.Delete(c.Request.Context(), id); err != nil {
		status := mapErrorToStatus(err)
		c.JSON(status, ErrorResponse{Error: err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
	c.Writer.WriteHeaderNow()
}

func (h *Handler) SearchMusicBrainz(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "query parameter 'q' is required"})
		return
	}
	results, err := h.service.SearchMusicBrainz(c.Request.Context(), query)
	if err != nil {
		c.JSON(http.StatusBadGateway, ErrorResponse{Error: "failed to search MusicBrainz"})
		return
	}
	c.JSON(http.StatusOK, results)
}

func mapErrorToStatus(err error) int {
	switch {
	case errors.Is(err, ErrNotFound):
		return http.StatusNotFound
	case errors.Is(err, ErrInvalidID), errors.Is(err, ErrInvalidGenre),
		errors.Is(err, ErrInvalidOrderBy), errors.Is(err, ErrInvalidOrderDir):
		return http.StatusBadRequest
	default:
		return http.StatusInternalServerError
	}
}
