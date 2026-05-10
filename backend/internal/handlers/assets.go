package handlers

import (
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"sams_table/internal/auth"
	"sams_table/internal/db/queries"
	"sams_table/internal/models"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

const max_upload_size = 50 << 20 // 50 MB

type AssetHandler struct {
	database_pool    *pgxpool.Pool
	webtoken_service *auth.JWTService
	storage_path     string
}

func New_Asset_Handler(database_pool *pgxpool.Pool, webtoken_service *auth.JWTService) *AssetHandler {
	storage_path := os.Getenv("ASSET_STORAGE_PATH")
	if storage_path == "" {
		storage_path = "./uploads"
	}
	return &AssetHandler{database_pool: database_pool, webtoken_service: webtoken_service, storage_path: storage_path}
}

// Upload handles POST /api/assets (multipart/form-data)
func (self *AssetHandler) Upload(response_writer http.ResponseWriter, request *http.Request) {
	claims := auth.Get_Claims_From_Context(request.Context())
	uploaded_by, err := uuid.Parse(claims.User_ID)
	if err != nil {
		write_error(response_writer, http.StatusBadRequest, "invalid user id in token")
		return
	}

	if err := request.ParseMultipartForm(max_upload_size); err != nil {
		write_error(response_writer, http.StatusBadRequest, "file too large or invalid form")
		return
	}

	file, _, err := request.FormFile("file")
	if err != nil {
		write_error(response_writer, http.StatusBadRequest, "missing file field")
		return
	}
	defer file.Close()

	// Read enough bytes to validate STL magic
	header := make([]byte, 80)
	n, err := io.ReadFull(file, header)
	if err != nil && n < 6 {
		write_error(response_writer, http.StatusBadRequest, "file too small to be a valid STL")
		return
	}
	is_ascii_stl := string(header[:6]) == "solid "
	is_binary_stl := n >= 80
	if !is_ascii_stl && !is_binary_stl {
		write_error(response_writer, http.StatusBadRequest, "file does not appear to be a valid STL")
		return
	}

	// Seek back to start so we can copy the full file
	if seeker, ok := file.(io.Seeker); ok {
		seeker.Seek(0, io.SeekStart)
	}

	// Ensure storage directory exists
	if err := os.MkdirAll(self.storage_path, 0755); err != nil {
		write_error(response_writer, http.StatusInternalServerError, "storage error")
		return
	}

	file_id := uuid.New()
	filename := file_id.String() + ".stl"
	dest_path := filepath.Join(self.storage_path, filename)

	dest, err := os.Create(dest_path)
	if err != nil {
		write_error(response_writer, http.StatusInternalServerError, "failed to save file")
		return
	}
	defer dest.Close()

	if _, err := io.Copy(dest, file); err != nil {
		write_error(response_writer, http.StatusInternalServerError, "failed to write file")
		return
	}

	// Parse optional campaign_id
	var campaign_id *uuid.UUID
	if raw := request.FormValue("campaign_id"); raw != "" {
		parsed, err := uuid.Parse(raw)
		if err != nil {
			write_error(response_writer, http.StatusBadRequest, "invalid campaign_id")
			return
		}
		campaign_id = &parsed
	}

	asset := models.UploadedAsset{
		Campaign_ID:  campaign_id,
		Uploaded_By:  uploaded_by,
		Label:        request.FormValue("label"),
		Storage_Path: filename,
		Asset_Type:   request.FormValue("asset_type"),
	}

	// Parse numeric form fields with safe defaults
	if v := request.FormValue("grid_width"); v != "" {
		var gw int
		if _, err := parse_int(v, &gw); err == nil {
			asset.Grid_Width = gw
		}
	}
	if v := request.FormValue("grid_depth"); v != "" {
		var gd int
		if _, err := parse_int(v, &gd); err == nil {
			asset.Grid_Depth = gd
		}
	}
	if v := request.FormValue("scale_factor"); v != "" {
		var sf float64
		if _, err := parse_float(v, &sf); err == nil {
			asset.Scale_Factor = sf
		}
	}

	created, err := queries.Create_Asset(request.Context(), self.database_pool, asset)
	if err != nil {
		os.Remove(dest_path)
		write_error(response_writer, http.StatusInternalServerError, "failed to save asset metadata")
		return
	}

	write_json(response_writer, http.StatusCreated, created)
}

// Serve handles GET /api/assets/{id}
func (self *AssetHandler) Serve(response_writer http.ResponseWriter, request *http.Request) {
	id, err := uuid.Parse(chi.URLParam(request, "id"))
	if err != nil {
		write_error(response_writer, http.StatusBadRequest, "invalid asset id")
		return
	}

	asset, err := queries.Get_Asset(request.Context(), self.database_pool, id)
	if err != nil {
		write_error(response_writer, http.StatusNotFound, "asset not found")
		return
	}

	file_path := filepath.Join(self.storage_path, asset.Storage_Path)
	f, err := os.Open(file_path)
	if err != nil {
		write_error(response_writer, http.StatusNotFound, "asset file not found")
		return
	}
	defer f.Close()

	response_writer.Header().Set("Content-Type", "application/octet-stream")
	response_writer.Header().Set("Content-Disposition", "attachment; filename=\""+asset.Label+".stl\"")
	io.Copy(response_writer, f)
}

// parseInt parses a string into an int pointer.
func parse_int(s string, out *int) (int, error) {
	v, err := strconv.Atoi(s)
	if err != nil {
		return 0, err
	}
	*out = v
	return v, nil
}

// parseFloat parses a string into a float64 pointer.
func parse_float(s string, out *float64) (float64, error) {
	v, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return 0, err
	}
	*out = v
	return v, nil
}
