package spotify

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

const (
	tokenURL          = "https://accounts.spotify.com/api/token"
	profileURL        = "https://api.spotify.com/v1/me"
	recentlyPlayedURL  = "https://api.spotify.com/v1/me/player/recently-played"
	libraryURL         = "https://api.spotify.com/v1/me/library"
	libraryContainsURL = "https://api.spotify.com/v1/me/library/contains"
	topArtistsURL      = "https://api.spotify.com/v1/me/top/artists"
	artistURL          = "https://api.spotify.com/v1/artists/"
	trackURL           = "https://api.spotify.com/v1/tracks/"
	albumURL           = "https://api.spotify.com/v1/albums/"
	audioFeaturesURL   = "https://api.spotify.com/v1/audio-features/"
	searchURL          = "https://api.spotify.com/v1/search"
)

type Config struct {
	ClientID     string
	ClientSecret string
	RedirectURI  string
}

type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
	TokenType    string `json:"token_type"`
}

type Followers struct {
	Total int `json:"total"`
}

type Profile struct {
	ID          string    `json:"id"`
	DisplayName string    `json:"display_name"`
	Email       string    `json:"email"`
	Country     string    `json:"country"`
	Product     string    `json:"product"`
	Followers   Followers `json:"followers"`
	Images      []Image   `json:"images"`
}

type Image struct {
	URL    string `json:"url"`
	Height int    `json:"height"`
	Width  int    `json:"width"`
}

// AvatarURL returns the URL of the first image, or empty string if none.
func (p *Profile) AvatarURL() string {
	if len(p.Images) > 0 {
		return p.Images[0].URL
	}
	return ""
}

// ExchangeCode exchanges an authorization code + PKCE code_verifier for access/refresh tokens.
func (c *Config) ExchangeCode(ctx context.Context, code, codeVerifier string) (*TokenResponse, error) {
	data := url.Values{
		"grant_type":    {"authorization_code"},
		"code":          {code},
		"redirect_uri":  {c.RedirectURI},
		"client_id":     {c.ClientID},
		"code_verifier": {codeVerifier},
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, tokenURL, strings.NewReader(data.Encode()))
	if err != nil {
		return nil, fmt.Errorf("creating token request: %w", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	// Include client_secret for confidential apps
	if c.ClientSecret != "" {
		req.SetBasicAuth(c.ClientID, c.ClientSecret)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("exchanging code: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("reading token response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("spotify token error (status %d): %s", resp.StatusCode, string(body))
	}

	var tokenResp TokenResponse
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return nil, fmt.Errorf("parsing token response: %w", err)
	}

	return &tokenResp, nil
}

// RefreshAccessToken uses a refresh token to get a new access token.
func (c *Config) RefreshAccessToken(ctx context.Context, refreshToken string) (*TokenResponse, error) {
	data := url.Values{
		"grant_type":    {"refresh_token"},
		"refresh_token": {refreshToken},
		"client_id":     {c.ClientID},
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, tokenURL, strings.NewReader(data.Encode()))
	if err != nil {
		return nil, fmt.Errorf("creating refresh request: %w", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	if c.ClientSecret != "" {
		req.SetBasicAuth(c.ClientID, c.ClientSecret)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("refreshing token: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("reading refresh response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("spotify refresh error (status %d): %s", resp.StatusCode, string(body))
	}

	var tokenResp TokenResponse
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return nil, fmt.Errorf("parsing refresh response: %w", err)
	}

	return &tokenResp, nil
}

// GetProfile fetches the current user's Spotify profile.
func GetProfile(ctx context.Context, accessToken string) (*Profile, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, profileURL, nil)
	if err != nil {
		return nil, fmt.Errorf("creating profile request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("fetching profile: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("reading profile response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("spotify profile error (status %d): %s", resp.StatusCode, string(body))
	}

	var profile Profile
	if err := json.Unmarshal(body, &profile); err != nil {
		return nil, fmt.Errorf("parsing profile: %w", err)
	}

	return &profile, nil
}

type RecentlyPlayedResponse struct {
	Items []PlayHistoryItem `json:"items"`
}

type PlayHistoryItem struct {
	Track    Track  `json:"track"`
	PlayedAt string `json:"played_at"`
}

type Track struct {
	ID         string   `json:"id"`
	Name       string   `json:"name"`
	DurationMs int      `json:"duration_ms"`
	Artists    []Artist `json:"artists"`
	Album      Album    `json:"album"`
}

type Artist struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type Album struct {
	Name   string  `json:"name"`
	Images []Image `json:"images"`
}

type ExternalURLs struct {
	Spotify string `json:"spotify"`
}

type FullArtist struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type FullAlbum struct {
	ID           string       `json:"id"`
	Name         string       `json:"name"`
	AlbumType    string       `json:"album_type"`
	ReleaseDate  string       `json:"release_date"`
	TotalTracks  int          `json:"total_tracks"`
	Label        string       `json:"label"`
	Popularity   int          `json:"popularity"`
	Genres       []string     `json:"genres"`
	Artists      []Artist     `json:"artists"`
	Images       []Image      `json:"images"`
	ExternalURLs ExternalURLs `json:"external_urls"`
}

type FullTrack struct {
	ID           string       `json:"id"`
	Name         string       `json:"name"`
	DurationMs   int          `json:"duration_ms"`
	Explicit     bool         `json:"explicit"`
	TrackNumber  int          `json:"track_number"`
	DiscNumber   int          `json:"disc_number"`
	PreviewURL   *string      `json:"preview_url"`
	Artists      []FullArtist `json:"artists"`
	Album        FullAlbum    `json:"album"`
	ExternalURLs ExternalURLs `json:"external_urls"`
}

type AudioFeatures struct {
	Danceability     float64 `json:"danceability"`
	Energy           float64 `json:"energy"`
	Acousticness     float64 `json:"acousticness"`
	Instrumentalness float64 `json:"instrumentalness"`
	Liveness         float64 `json:"liveness"`
	Speechiness      float64 `json:"speechiness"`
	Valence          float64 `json:"valence"`
	Tempo            float64 `json:"tempo"`
	Key              int     `json:"key"`
	Mode             int     `json:"mode"`
	Loudness         float64 `json:"loudness"`
	TimeSignature    int     `json:"time_signature"`
}

// TopArtist represents an artist from the /me/top/artists endpoint.
type TopArtist struct {
	ID           string       `json:"id"`
	Name         string       `json:"name"`
	Genres       []string     `json:"genres"`
	Popularity   int          `json:"popularity"`
	Followers    Followers    `json:"followers"`
	Images       []Image      `json:"images"`
	ExternalURLs ExternalURLs `json:"external_urls"`
}

// ImageURL returns the URL of the first image, or empty string if none.
func (a *TopArtist) ImageURL() string {
	if len(a.Images) > 0 {
		return a.Images[0].URL
	}
	return ""
}

// TopArtistsResponse is the response from GET /me/top/artists.
type TopArtistsResponse struct {
	Items []TopArtist `json:"items"`
}

// GetTopArtists fetches the user's top artists for the given time range.
func GetTopArtists(ctx context.Context, accessToken, timeRange string, limit int) (*TopArtistsResponse, error) {
	u := fmt.Sprintf("%s?time_range=%s&limit=%d", topArtistsURL, timeRange, limit)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, fmt.Errorf("creating top-artists request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("fetching top artists: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("reading top-artists response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("spotify top-artists error (status %d): %s", resp.StatusCode, string(body))
	}

	var result TopArtistsResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("parsing top-artists response: %w", err)
	}

	return &result, nil
}

// GetArtist fetches a single artist by ID (public endpoint, no special scope needed).
func GetArtist(ctx context.Context, accessToken, artistID string) (*TopArtist, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, artistURL+artistID, nil)
	if err != nil {
		return nil, fmt.Errorf("creating artist request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("fetching artist: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("reading artist response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("spotify artist error (status %d): %s", resp.StatusCode, string(body))
	}

	var result TopArtist
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("parsing artist response: %w", err)
	}

	return &result, nil
}

// CheckSavedTracks checks if the given track IDs are saved in the user's library.
func CheckSavedTracks(ctx context.Context, accessToken string, ids []string) ([]bool, error) {
	uris := make([]string, len(ids))
	for i, id := range ids {
		uris[i] = "spotify:track:" + id
	}
	u := libraryContainsURL + "?uris=" + strings.Join(uris, ",")
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, fmt.Errorf("creating check-saved request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("checking saved tracks: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("reading check-saved response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("spotify check-saved error (status %d): %s", resp.StatusCode, string(body))
	}

	var result []bool
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("parsing check-saved response: %w", err)
	}

	return result, nil
}

// SaveTracks saves the given track IDs to the user's library using the new PUT /me/library endpoint.
func SaveTracks(ctx context.Context, accessToken string, ids []string) error {
	uris := make([]string, len(ids))
	for i, id := range ids {
		uris[i] = "spotify:track:" + id
	}
	u := libraryURL + "?uris=" + strings.Join(uris, ",")
	req, err := http.NewRequestWithContext(ctx, http.MethodPut, u, nil)
	if err != nil {
		return fmt.Errorf("creating save-tracks request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("saving tracks: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("spotify save-tracks error (status %d): %s", resp.StatusCode, string(body))
	}

	return nil
}

// RemoveTracks removes the given track IDs from the user's library using the new DELETE /me/library endpoint.
func RemoveTracks(ctx context.Context, accessToken string, ids []string) error {
	uris := make([]string, len(ids))
	for i, id := range ids {
		uris[i] = "spotify:track:" + id
	}
	u := libraryURL + "?uris=" + strings.Join(uris, ",")
	req, err := http.NewRequestWithContext(ctx, http.MethodDelete, u, nil)
	if err != nil {
		return fmt.Errorf("creating remove-tracks request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("removing tracks: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("spotify remove-tracks error (status %d): %s", resp.StatusCode, string(body))
	}

	return nil
}

// GetRecentlyPlayed fetches the user's recently played tracks (up to 50).
func GetRecentlyPlayed(ctx context.Context, accessToken string) (*RecentlyPlayedResponse, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, recentlyPlayedURL+"?limit=50", nil)
	if err != nil {
		return nil, fmt.Errorf("creating recently-played request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("fetching recently played: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("reading recently-played response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("spotify recently-played error (status %d): %s", resp.StatusCode, string(body))
	}

	var result RecentlyPlayedResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("parsing recently-played response: %w", err)
	}

	return &result, nil
}

// GetTrack fetches a single track by ID.
func GetTrack(ctx context.Context, accessToken, trackID string) (*FullTrack, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, trackURL+trackID, nil)
	if err != nil {
		return nil, fmt.Errorf("creating track request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("fetching track: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("reading track response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("spotify track error (status %d): %s", resp.StatusCode, string(body))
	}

	var result FullTrack
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("parsing track response: %w", err)
	}

	return &result, nil
}

// GetAlbum fetches a single album by ID.
func GetAlbum(ctx context.Context, accessToken, albumID string) (*FullAlbum, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, albumURL+albumID, nil)
	if err != nil {
		return nil, fmt.Errorf("creating album request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("fetching album: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("reading album response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("spotify album error (status %d): %s", resp.StatusCode, string(body))
	}

	var result FullAlbum
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("parsing album response: %w", err)
	}

	return &result, nil
}

// GetAudioFeatures fetches audio features for a single track by ID.
func GetAudioFeatures(ctx context.Context, accessToken, trackID string) (*AudioFeatures, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, audioFeaturesURL+trackID, nil)
	if err != nil {
		return nil, fmt.Errorf("creating audio-features request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("fetching audio features: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("reading audio-features response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("spotify audio-features error (status %d): %s", resp.StatusCode, string(body))
	}

	var result AudioFeatures
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("parsing audio-features response: %w", err)
	}

	return &result, nil
}

// SearchResponse represents the response from the Spotify search endpoint.
type SearchResponse struct {
	Tracks  *SearchTracks  `json:"tracks"`
	Albums  *SearchAlbums  `json:"albums"`
	Artists *SearchArtists `json:"artists"`
}

type SearchTracks struct {
	Items []SearchTrack `json:"items"`
}

type SearchTrack struct {
	ID         string   `json:"id"`
	Name       string   `json:"name"`
	DurationMs int      `json:"duration_ms"`
	Artists    []Artist `json:"artists"`
	Album      Album    `json:"album"`
}

type SearchAlbums struct {
	Items []SearchAlbum `json:"items"`
}

type SearchAlbum struct {
	ID           string       `json:"id"`
	Name         string       `json:"name"`
	AlbumType    string       `json:"album_type"`
	ReleaseDate  string       `json:"release_date"`
	Artists      []Artist     `json:"artists"`
	Images       []Image      `json:"images"`
	ExternalURLs ExternalURLs `json:"external_urls"`
}

type SearchArtists struct {
	Items []SearchArtist `json:"items"`
}

type SearchArtist struct {
	ID           string       `json:"id"`
	Name         string       `json:"name"`
	Genres       []string     `json:"genres"`
	Popularity   int          `json:"popularity"`
	Followers    Followers    `json:"followers"`
	Images       []Image      `json:"images"`
	ExternalURLs ExternalURLs `json:"external_urls"`
}

// Search queries the Spotify search endpoint for tracks, albums, and/or artists.
func Search(ctx context.Context, accessToken, query, types string, limit int) (*SearchResponse, error) {
	params := url.Values{
		"q":     {query},
		"type":  {types},
		"limit": {strconv.Itoa(limit)},
	}
	reqURL := searchURL + "?" + params.Encode()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
	if err != nil {
		return nil, fmt.Errorf("creating search request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("searching spotify: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("reading search response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("spotify search error (status %d): %s", resp.StatusCode, string(body))
	}

	var result SearchResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("parsing search response: %w", err)
	}

	return &result, nil
}
