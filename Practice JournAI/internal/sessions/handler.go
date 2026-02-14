package sessions

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
	status := c.Query("status")
	orderBy := c.Query("order_by")
	orderDir := c.Query("order_dir")

	sessions, err := h.service.List(c.Request.Context(), genre, status, orderBy, orderDir)
	if err != nil {
		status := mapErrorToStatus(err)
		c.JSON(status, ErrorResponse{Error: err.Error()})
		return
	}
	c.JSON(http.StatusOK, sessions)
}

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

func (h *Handler) CreateNote(c *gin.Context) {
	sessionID := c.Param("id")
	var req CreateNoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}
	note, err := h.service.CreateNote(c.Request.Context(), sessionID, req)
	if err != nil {
		status := mapErrorToStatus(err)
		c.JSON(status, ErrorResponse{Error: err.Error()})
		return
	}
	c.JSON(http.StatusCreated, note)
}

func (h *Handler) DeleteNote(c *gin.Context) {
	sessionID := c.Param("id")
	noteID := c.Param("noteId")
	if err := h.service.DeleteNote(c.Request.Context(), sessionID, noteID); err != nil {
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
	case errors.Is(err, ErrNoteNotFound):
		return http.StatusNotFound
	case errors.Is(err, ErrInvalidID), errors.Is(err, ErrInvalidNoteID),
		errors.Is(err, ErrInvalidDate), errors.Is(err, ErrInvalidGenre),
		errors.Is(err, ErrInvalidStatus), errors.Is(err, ErrInvalidEnergy),
		errors.Is(err, ErrInvalidOrderBy), errors.Is(err, ErrInvalidOrderDir):
		return http.StatusBadRequest
	default:
		return http.StatusInternalServerError
	}
}
