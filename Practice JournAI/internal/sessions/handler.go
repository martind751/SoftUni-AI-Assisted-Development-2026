package sessions

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
)

// ErrorResponse is the standard error shape returned by session endpoints.
type ErrorResponse struct {
	Error string `json:"error"`
}

// Handler holds dependencies for session HTTP endpoints.
type Handler struct {
	service *Service
}

// NewHandler creates a new sessions handler backed by the given service.
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// List returns all practice sessions ordered by due date.
func (h *Handler) List(c *gin.Context) {
	sessions, err := h.service.List(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}
	c.JSON(http.StatusOK, sessions)
}

// GetByID returns a single practice session by ID.
func (h *Handler) GetByID(c *gin.Context) {
	id := c.Param("id")
	session, err := h.service.GetByID(c.Request.Context(), id)
	if err != nil {
		status := mapErrorToStatus(err)
		c.JSON(status, ErrorResponse{Error: err.Error()})
		return
	}
	c.JSON(http.StatusOK, session)
}

// Create handles POST requests to create a new practice session.
func (h *Handler) Create(c *gin.Context) {
	var req CreateSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}
	session, err := h.service.Create(c.Request.Context(), req)
	if err != nil {
		status := mapErrorToStatus(err)
		c.JSON(status, ErrorResponse{Error: err.Error()})
		return
	}
	c.JSON(http.StatusCreated, session)
}

// Update handles PUT requests to update an existing practice session.
func (h *Handler) Update(c *gin.Context) {
	id := c.Param("id")
	var req UpdateSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}
	session, err := h.service.Update(c.Request.Context(), id, req)
	if err != nil {
		status := mapErrorToStatus(err)
		c.JSON(status, ErrorResponse{Error: err.Error()})
		return
	}
	c.JSON(http.StatusOK, session)
}

// Delete handles DELETE requests to remove a practice session.
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

func mapErrorToStatus(err error) int {
	switch {
	case errors.Is(err, ErrNotFound):
		return http.StatusNotFound
	case errors.Is(err, ErrInvalidID), errors.Is(err, ErrInvalidDate):
		return http.StatusBadRequest
	default:
		return http.StatusInternalServerError
	}
}
