package kavach

// Kavach represents the official Kavach Shield Engine SDK for Go.
type Kavach struct{}

// New creates a new Kavach SDK client.
func New() *Kavach {
	return &Kavach{}
}

// Version returns the current version of the Kavach SDK.
func (k *Kavach) Version() string {
	return "1.0.4"
}
