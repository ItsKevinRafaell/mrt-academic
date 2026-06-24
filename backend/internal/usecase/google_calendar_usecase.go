package usecase

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"mrt-backend/internal/domain"

	"google.golang.org/api/calendar/v3"
	"google.golang.org/api/option"
)

type GoogleCalendarUsecase struct {
	svc    *calendar.Service
	calID  string
	sched  domain.ScheduleRepository
	course domain.CourseRepository
}

func NewGoogleCalendarUsecase(jsonKey []byte, calID string, schedRepo domain.ScheduleRepository, courseRepo domain.CourseRepository) (*GoogleCalendarUsecase, error) {
	ctx := context.Background()
	creds := option.WithCredentialsJSON(jsonKey)
	svc, err := calendar.NewService(ctx, creds)
	if err != nil {
		return nil, fmt.Errorf("google cal service: %w", err)
	}
	return &GoogleCalendarUsecase{
		svc:    svc,
		calID:  calID,
		sched:  schedRepo,
		course: courseRepo,
	}, nil
}

func (u *GoogleCalendarUsecase) Sync(ctx context.Context) (int, error) {
	now := time.Now()
	events, err := u.svc.Events.List(u.calID).
		SingleEvents(true).
		OrderBy("startTime").
		TimeMin(now.Format(time.RFC3339)).
		TimeMax(now.AddDate(0, 0, 7).Format(time.RFC3339)).
		Do()
	if err != nil {
		return 0, fmt.Errorf("list events: %w", err)
	}

	courses, _, err := u.course.GetAll(1, 1000, 0)
	if err != nil {
		return 0, fmt.Errorf("list courses: %w", err)
	}
	courseMap := make(map[string]*domain.Course)
	for i := range courses {
		c := &courses[i]
		courseMap[strings.ToUpper(c.Code)] = c
		courseMap[strings.ToUpper(c.Name)] = c
	}

	synced := 0
	for _, ev := range events.Items {
		if ev.Start == nil || ev.End == nil {
			continue
		}

		startTime, err := parseTime(ev.Start.DateTime, ev.Start.Date)
		if err != nil {
			continue
		}
		endTime, err := parseTime(ev.End.DateTime, ev.End.Date)
		if err != nil {
			continue
		}

		var matchedCourse *domain.Course
		searchText := strings.ToUpper(ev.Summary + " " + ev.Description)
		for key, c := range courseMap {
			if strings.Contains(searchText, key) {
				matchedCourse = c
				break
			}
		}
		if matchedCourse == nil {
			log.Printf("[gcal] no course match for event: %s", ev.Summary)
			continue
		}

		if len(ev.Recurrence) > 0 {
			dayOfWeek := int(startTime.Weekday())
			startStr := startTime.Format("15:04:05")
			endStr := endTime.Format("15:04:05")

			existing, _ := u.sched.GetAll()
			alreadyExists := false
			for _, s := range existing {
				if s.CourseID == matchedCourse.ID && s.DayOfWeek == dayOfWeek && s.StartTime == startStr && s.EndTime == endStr {
					alreadyExists = true
					break
				}
			}
			if !alreadyExists {
				schedule := &domain.Schedule{
					CourseID:  matchedCourse.ID,
					DayOfWeek: dayOfWeek,
					StartTime: startStr,
					EndTime:   endStr,
				}
				if err := u.sched.Create(schedule); err != nil {
					log.Printf("[gcal] failed to create schedule: %v", err)
				} else {
					synced++
					log.Printf("[gcal] created schedule: %s on day %d %s-%s", matchedCourse.Name, dayOfWeek, startStr, endStr)
				}
			}
		} else {
			log.Printf("[gcal] one-time event skipped (no calendar_event repo yet): %s", ev.Summary)
		}
	}

	return synced, nil
}

func (u *GoogleCalendarUsecase) GetEvents(ctx context.Context, days int) ([]domain.CalendarEvent, error) {
	now := time.Now()
	maxDays := days
	if maxDays <= 0 {
		maxDays = 7
	}

	events, err := u.svc.Events.List(u.calID).
		SingleEvents(true).
		OrderBy("startTime").
		TimeMin(now.Format(time.RFC3339)).
		TimeMax(now.AddDate(0, 0, maxDays).Format(time.RFC3339)).
		Do()
	if err != nil {
		return nil, fmt.Errorf("list events: %w", err)
	}

	var result []domain.CalendarEvent
	for _, ev := range events.Items {
		if ev.Start == nil || ev.End == nil {
			continue
		}
		startTime, _ := parseTime(ev.Start.DateTime, ev.Start.Date)
		endTime, _ := parseTime(ev.End.DateTime, ev.End.Date)

		result = append(result, domain.CalendarEvent{
			Title:     ev.Summary,
			StartTime: startTime,
			EndTime:   endTime,
		})
	}

	return result, nil
}

func parseTime(dateTime, date string) (time.Time, error) {
	if dateTime != "" {
		return time.Parse(time.RFC3339, dateTime)
	}
	if date != "" {
		return time.Parse("2006-01-02", date)
	}
	return time.Time{}, fmt.Errorf("no time info")
}

func (u *GoogleCalendarUsecase) TestConnection(ctx context.Context) error {
	cal, err := u.svc.Calendars.Get(u.calID).Do()
	if err != nil {
		return fmt.Errorf("calendar access: %w", err)
	}
	log.Printf("[gcal] connected to calendar: %s (%s)", cal.Summary, cal.Id)
	return nil
}
