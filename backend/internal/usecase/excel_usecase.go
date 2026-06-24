package usecase

import (
	"fmt"
	"io"
	"mrt-backend/internal/domain"
	"strconv"
	"strings"

	"github.com/xuri/excelize/v2"
)

type ExcelUsecase struct {
	courseRepo   domain.CourseRepository
	sessionRepo  domain.SessionRepository
	materialRepo domain.MaterialRepository
	gradeUsecase *GradeUsecase
}

func NewExcelUsecase(
	courseRepo domain.CourseRepository,
	sessionRepo domain.SessionRepository,
	materialRepo domain.MaterialRepository,
	gradeUsecase *GradeUsecase,
) *ExcelUsecase {
	return &ExcelUsecase{
		courseRepo:   courseRepo,
		sessionRepo:  sessionRepo,
		materialRepo: materialRepo,
		gradeUsecase: gradeUsecase,
	}
}

type CourseExportData struct {
	Course    domain.Course
	Sessions  []domain.Session
	Materials []domain.Material
}

func (uc *ExcelUsecase) ExportGrades(userID string, cawu int) ([]byte, error) {
	ipkData, err := uc.gradeUsecase.GetIPKData(userID)
	if err != nil {
		return nil, err
	}

	if cawu > 0 {
		filtered := []domain.IPKData{}
		for _, data := range ipkData {
			if data.CawuID == cawu {
				filtered = append(filtered, data)
			}
		}
		ipkData = filtered
	}

	f := excelize.NewFile()
	defer f.Close()

	sheet := "Nilai"
	f.SetSheetName("Sheet1", sheet)

	f.SetCellValue(sheet, "A1", "Mata Kuliah")
	f.SetCellValue(sheet, "B1", "Kode")
	f.SetCellValue(sheet, "C1", "SKS")
	f.SetCellValue(sheet, "D1", "Cawu")
	f.SetCellValue(sheet, "E1", "Nilai Akhir")
	f.SetCellValue(sheet, "F1", "Grade")

	row := 2
	for _, course := range ipkData {
		finalScore := 0.0
		totalWeight := 0.0
		for _, comp := range course.Components {
			if comp.Score != nil {
				finalScore += (*comp.Score * comp.Weight) / 100
				totalWeight += comp.Weight
			}
		}

		var letterGrade string
		if totalWeight == 0 {
			letterGrade = "-"
		} else if finalScore >= 85 {
			letterGrade = "A"
		} else if finalScore >= 80 {
			letterGrade = "A-"
		} else if finalScore >= 75 {
			letterGrade = "B+"
		} else if finalScore >= 70 {
			letterGrade = "B"
		} else if finalScore >= 65 {
			letterGrade = "B-"
		} else if finalScore >= 60 {
			letterGrade = "C+"
		} else if finalScore >= 55 {
			letterGrade = "C"
		} else if finalScore >= 40 {
			letterGrade = "D"
		} else {
			letterGrade = "E"
		}

		f.SetCellValue(sheet, fmt.Sprintf("A%d", row), course.CourseName)
		f.SetCellValue(sheet, fmt.Sprintf("B%d", row), course.CourseCode)
		f.SetCellValue(sheet, fmt.Sprintf("C%d", row), course.SKS)
		f.SetCellValue(sheet, fmt.Sprintf("D%d", row), course.CawuID)
		f.SetCellValue(sheet, fmt.Sprintf("E%d", row), fmt.Sprintf("%.2f", finalScore))
		f.SetCellValue(sheet, fmt.Sprintf("F%d", row), letterGrade)
		row++
	}

	// Style header
	style, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true},
		Fill: excelize.Fill{Type: "pattern", Pattern: 1, Color: []string{"#D3D3D3"}},
	})
	f.SetCellStyle(sheet, "A1", "F1", style)

	buf, err := f.WriteToBuffer()
	if err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

func (uc *ExcelUsecase) ExportCourses() ([]byte, error) {
	courses, _, err := uc.courseRepo.GetAll(1, 10000, 0)
	if err != nil {
		return nil, err
	}

	f := excelize.NewFile()
	defer f.Close()

	courseSheet := "Courses"
	sessionSheet := "Sessions"
	materialSheet := "Materials"

	f.SetSheetName("Sheet1", courseSheet)
	f.NewSheet(sessionSheet)
	f.NewSheet(materialSheet)

	f.SetCellValue(courseSheet, "A1", "ID")
	f.SetCellValue(courseSheet, "B1", "Code")
	f.SetCellValue(courseSheet, "C1", "Name")
	f.SetCellValue(courseSheet, "D1", "SKS")
	f.SetCellValue(courseSheet, "E1", "Description")
	f.SetCellValue(courseSheet, "F1", "Instructors")

	f.SetCellValue(sessionSheet, "A1", "ID")
	f.SetCellValue(sessionSheet, "B1", "CourseID")
	f.SetCellValue(sessionSheet, "C1", "Number")
	f.SetCellValue(sessionSheet, "D1", "Title")
	f.SetCellValue(sessionSheet, "E1", "Description")

	f.SetCellValue(materialSheet, "A1", "ID")
	f.SetCellValue(materialSheet, "B1", "SessionID")
	f.SetCellValue(materialSheet, "C1", "Title")
	f.SetCellValue(materialSheet, "D1", "Description")
	f.SetCellValue(materialSheet, "E1", "Type")
	f.SetCellValue(materialSheet, "F1", "URL")

	courseRow := 2
	sessionRow := 2
	materialRow := 2

	for _, course := range courses {
		f.SetCellValue(courseSheet, fmt.Sprintf("A%d", courseRow), course.ID)
		f.SetCellValue(courseSheet, fmt.Sprintf("B%d", courseRow), course.Code)
		f.SetCellValue(courseSheet, fmt.Sprintf("C%d", courseRow), course.Name)
		f.SetCellValue(courseSheet, fmt.Sprintf("D%d", courseRow), course.SKS)
		f.SetCellValue(courseSheet, fmt.Sprintf("E%d", courseRow), course.Description)
		f.SetCellValue(courseSheet, fmt.Sprintf("F%d", courseRow), strings.Join(course.Instructors, ";"))

		sessions, _, err := uc.sessionRepo.GetByCourseID(course.ID, 1, 10000)
		if err != nil {
			return nil, err
		}

		for _, session := range sessions {
			f.SetCellValue(sessionSheet, fmt.Sprintf("A%d", sessionRow), session.ID)
			f.SetCellValue(sessionSheet, fmt.Sprintf("B%d", sessionRow), session.CourseID)
			f.SetCellValue(sessionSheet, fmt.Sprintf("C%d", sessionRow), session.Number)
			f.SetCellValue(sessionSheet, fmt.Sprintf("D%d", sessionRow), session.Title)
			f.SetCellValue(sessionSheet, fmt.Sprintf("E%d", sessionRow), session.Description)

			materials, err := uc.materialRepo.GetBySessionID(session.ID)
			if err != nil {
				return nil, err
			}

			for _, material := range materials {
				f.SetCellValue(materialSheet, fmt.Sprintf("A%d", materialRow), material.ID)
				f.SetCellValue(materialSheet, fmt.Sprintf("B%d", materialRow), *material.SessionID)
				f.SetCellValue(materialSheet, fmt.Sprintf("C%d", materialRow), material.Title)
				f.SetCellValue(materialSheet, fmt.Sprintf("D%d", materialRow), material.Description)
				f.SetCellValue(materialSheet, fmt.Sprintf("E%d", materialRow), material.Type)
				f.SetCellValue(materialSheet, fmt.Sprintf("F%d", materialRow), material.URL)
				materialRow++
			}

			sessionRow++
		}

		courseRow++
	}

	buf, err := f.WriteToBuffer()
	if err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

func (uc *ExcelUsecase) ExportTemplate() ([]byte, error) {
	f := excelize.NewFile()
	defer f.Close()

	courseSheet := "Courses"
	sessionSheet := "Sessions"
	materialSheet := "Materials"

	f.SetSheetName("Sheet1", courseSheet)
	f.NewSheet(sessionSheet)
	f.NewSheet(materialSheet)

	f.SetCellValue(courseSheet, "A1", "Code")
	f.SetCellValue(courseSheet, "B1", "Name")
	f.SetCellValue(courseSheet, "C1", "SKS")
	f.SetCellValue(courseSheet, "D1", "Description")
	f.SetCellValue(courseSheet, "E1", "Instructors")

	f.SetCellValue(sessionSheet, "A1", "CourseCode")
	f.SetCellValue(sessionSheet, "B1", "Number")
	f.SetCellValue(sessionSheet, "C1", "Title")
	f.SetCellValue(sessionSheet, "D1", "Description")

	f.SetCellValue(materialSheet, "A1", "CourseCode")
	f.SetCellValue(materialSheet, "B1", "SessionNumber")
	f.SetCellValue(materialSheet, "C1", "Title")
	f.SetCellValue(materialSheet, "D1", "Description")
	f.SetCellValue(materialSheet, "E1", "Type")
	f.SetCellValue(materialSheet, "F1", "URL")

	buf, err := f.WriteToBuffer()
	if err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

type ImportResult struct {
	CoursesCreated   int `json:"courses_created"`
	SessionsCreated  int `json:"sessions_created"`
	MaterialsCreated int `json:"materials_created"`
}

func (uc *ExcelUsecase) ImportCourses(reader io.Reader) (*ImportResult, error) {
	f, err := excelize.OpenReader(reader)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	result := &ImportResult{}

	courseSheet := "Courses"
	sessionSheet := "Sessions"
	materialSheet := "Materials"

	courseRows, err := f.GetRows(courseSheet)
	if err != nil {
		return nil, err
	}

	courseCodeToID := make(map[string]int)

	for i, row := range courseRows {
		if i == 0 {
			continue
		}

		if len(row) < 3 {
			continue
		}

		code := strings.TrimSpace(row[0])
		name := strings.TrimSpace(row[1])
		sksStr := strings.TrimSpace(row[2])
		description := ""
		if len(row) > 3 {
			description = strings.TrimSpace(row[3])
		}
		instructorsStr := ""
		if len(row) > 4 {
			instructorsStr = strings.TrimSpace(row[4])
		}

		sks, err := strconv.Atoi(sksStr)
		if err != nil {
			return nil, fmt.Errorf("invalid SKS value in row %d: %s", i+1, sksStr)
		}

		instructors := []string{}
		if instructorsStr != "" {
			instructors = strings.Split(instructorsStr, ";")
			for j := range instructors {
				instructors[j] = strings.TrimSpace(instructors[j])
			}
		}

		course := &domain.Course{
			Code:        code,
			Name:        name,
			SKS:         sks,
			Description: description,
			Instructors: instructors,
		}

		existingCourses, _, err := uc.courseRepo.GetAll(1, 10000, 0)
		if err != nil {
			return nil, err
		}

		var existingCourse *domain.Course
		for _, c := range existingCourses {
			if c.Code == code {
				existingCourse = &c
				break
			}
		}

		if existingCourse != nil {
			course.ID = existingCourse.ID
			if err := uc.courseRepo.Update(course); err != nil {
				return nil, err
			}
			courseCodeToID[code] = existingCourse.ID
		} else {
			if err := uc.courseRepo.Create(course); err != nil {
				return nil, err
			}
			courseCodeToID[code] = course.ID
			result.CoursesCreated++
		}
	}

	sessionRows, err := f.GetRows(sessionSheet)
	if err == nil {
		for i, row := range sessionRows {
			if i == 0 {
				continue
			}

			if len(row) < 4 {
				continue
			}

			courseCode := strings.TrimSpace(row[0])
			numberStr := strings.TrimSpace(row[1])
			title := strings.TrimSpace(row[2])
			description := ""
			if len(row) > 3 {
				description = strings.TrimSpace(row[3])
			}

			courseID, exists := courseCodeToID[courseCode]
			if !exists {
				return nil, fmt.Errorf("course code %s not found in row %d", courseCode, i+1)
			}

			number, err := strconv.Atoi(numberStr)
			if err != nil {
				return nil, fmt.Errorf("invalid session number in row %d: %s", i+1, numberStr)
			}

			session := &domain.Session{
				CourseID:    courseID,
				Number:      number,
				Title:       title,
				Description: description,
			}

			if err := uc.sessionRepo.Create(session); err != nil {
				return nil, err
			}
			result.SessionsCreated++
		}
	}

	materialRows, err := f.GetRows(materialSheet)
	if err == nil {
		for i, row := range materialRows {
			if i == 0 {
				continue
			}

			if len(row) < 6 {
				continue
			}

			courseCode := strings.TrimSpace(row[0])
			sessionNumberStr := strings.TrimSpace(row[1])
			title := strings.TrimSpace(row[2])
			description := strings.TrimSpace(row[3])
			materialType := strings.TrimSpace(row[4])
			url := strings.TrimSpace(row[5])

			courseID, exists := courseCodeToID[courseCode]
			if !exists {
				return nil, fmt.Errorf("course code %s not found in row %d", courseCode, i+1)
			}

			sessionNumber, err := strconv.Atoi(sessionNumberStr)
			if err != nil {
				return nil, fmt.Errorf("invalid session number in row %d: %s", i+1, sessionNumberStr)
			}

			sessions, _, err := uc.sessionRepo.GetByCourseID(courseID, 1, 10000)
			if err != nil {
				return nil, err
			}

			var sessionID int
			found := false
			for _, s := range sessions {
				if s.Number == sessionNumber {
					sessionID = s.ID
					found = true
					break
				}
			}

			if !found {
				return nil, fmt.Errorf("session %d not found for course %s in row %d", sessionNumber, courseCode, i+1)
			}

			material := &domain.Material{
				SessionID:   &sessionID,
				Title:       title,
				Description: description,
				Type:        materialType,
				URL:         url,
			}

			if err := uc.materialRepo.Create(material); err != nil {
				return nil, err
			}
			result.MaterialsCreated++
		}
	}

	return result, nil
}

type PreviewCourse struct {
	Code        string   `json:"code"`
	Name        string   `json:"name"`
	SKS         int      `json:"sks"`
	Description string   `json:"description"`
	Instructors []string `json:"instructors"`
	Exists      bool     `json:"exists"`
}

type PreviewSession struct {
	CourseCode  string `json:"course_code"`
	Number      int    `json:"number"`
	Title       string `json:"title"`
	Description string `json:"description"`
}

type PreviewMaterial struct {
	CourseCode    string `json:"course_code"`
	SessionNumber int    `json:"session_number"`
	Title         string `json:"title"`
	Description   string `json:"description"`
	Type          string `json:"type"`
	URL           string `json:"url"`
}

type ImportPreview struct {
	Courses   []PreviewCourse   `json:"courses"`
	Sessions  []PreviewSession  `json:"sessions"`
	Materials []PreviewMaterial `json:"materials"`
}

func (uc *ExcelUsecase) PreviewImport(reader io.Reader) (*ImportPreview, error) {
	f, err := excelize.OpenReader(reader)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	preview := &ImportPreview{
		Courses:   []PreviewCourse{},
		Sessions:  []PreviewSession{},
		Materials: []PreviewMaterial{},
	}

	courseSheet := "Courses"
	sessionSheet := "Sessions"
	materialSheet := "Materials"

	existingCourses, _, err := uc.courseRepo.GetAll(1, 10000, 0)
	if err != nil {
		return nil, err
	}

	existingCourseMap := make(map[string]bool)
	for _, c := range existingCourses {
		existingCourseMap[c.Code] = true
	}

	courseRows, err := f.GetRows(courseSheet)
	if err != nil {
		return nil, err
	}

	for i, row := range courseRows {
		if i == 0 {
			continue
		}

		if len(row) < 3 {
			continue
		}

		code := strings.TrimSpace(row[0])
		name := strings.TrimSpace(row[1])
		sksStr := strings.TrimSpace(row[2])
		description := ""
		if len(row) > 3 {
			description = strings.TrimSpace(row[3])
		}
		instructorsStr := ""
		if len(row) > 4 {
			instructorsStr = strings.TrimSpace(row[4])
		}

		sks, err := strconv.Atoi(sksStr)
		if err != nil {
			return nil, fmt.Errorf("invalid SKS value in row %d: %s", i+1, sksStr)
		}

		instructors := []string{}
		if instructorsStr != "" {
			instructors = strings.Split(instructorsStr, ";")
			for j := range instructors {
				instructors[j] = strings.TrimSpace(instructors[j])
			}
		}

		preview.Courses = append(preview.Courses, PreviewCourse{
			Code:        code,
			Name:        name,
			SKS:         sks,
			Description: description,
			Instructors: instructors,
			Exists:      existingCourseMap[code],
		})
	}

	sessionRows, err := f.GetRows(sessionSheet)
	if err == nil {
		for i, row := range sessionRows {
			if i == 0 {
				continue
			}

			if len(row) < 4 {
				continue
			}

			courseCode := strings.TrimSpace(row[0])
			numberStr := strings.TrimSpace(row[1])
			title := strings.TrimSpace(row[2])
			description := ""
			if len(row) > 3 {
				description = strings.TrimSpace(row[3])
			}

			number, err := strconv.Atoi(numberStr)
			if err != nil {
				return nil, fmt.Errorf("invalid session number in row %d: %s", i+1, numberStr)
			}

			preview.Sessions = append(preview.Sessions, PreviewSession{
				CourseCode:  courseCode,
				Number:      number,
				Title:       title,
				Description: description,
			})
		}
	}

	materialRows, err := f.GetRows(materialSheet)
	if err == nil {
		for i, row := range materialRows {
			if i == 0 {
				continue
			}

			if len(row) < 6 {
				continue
			}

			courseCode := strings.TrimSpace(row[0])
			sessionNumberStr := strings.TrimSpace(row[1])
			title := strings.TrimSpace(row[2])
			description := strings.TrimSpace(row[3])
			materialType := strings.TrimSpace(row[4])
			url := strings.TrimSpace(row[5])

			sessionNumber, err := strconv.Atoi(sessionNumberStr)
			if err != nil {
				return nil, fmt.Errorf("invalid session number in row %d: %s", i+1, sessionNumberStr)
			}

			preview.Materials = append(preview.Materials, PreviewMaterial{
				CourseCode:    courseCode,
				SessionNumber: sessionNumber,
				Title:         title,
				Description:   description,
				Type:          materialType,
				URL:           url,
			})
		}
	}

	return preview, nil
}
