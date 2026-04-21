package models

type ChatContext struct {
	CurrentYear       int    `json:"currentYear"`
	CurrentPlace      string `json:"currentPlace"`
	CurrentState      string `json:"currentState"`
	CurrentAge        int    `json:"currentAge"`
	Era               string `json:"era"`
	BirthYear         int    `json:"birthYear"`
	Biography         string `json:"biography"`
	ChoiceDescription string `json:"choiceDescription,omitempty"`
}