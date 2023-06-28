package main

import (
	"bytes"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/tdewolff/minify/v2"
	"github.com/tdewolff/minify/v2/css"
)

func CssMinify(input string) (string, error) {
	minifier := minify.New()
	minifier.AddFunc("text/css", css.Minify)
	output := bytes.NewBuffer([]byte{})
	fileReader := strings.NewReader(input)
	err := css.Minify(minifier, output, fileReader, map[string]string{})
	if err != nil {
		return "", fmt.Errorf("minification error: %v", err)
	}
	return output.String(), nil
}

func MinifyDesktop() {
	buf, err := os.ReadFile("../assets/css/field-picker.css")
	if err != nil {
		log.Fatalln(err)
	}

	output, err := CssMinify(string(buf))
	if err != nil {
		log.Fatalln(err)
	}

	err = os.WriteFile("../assets/css/field-picker.min.css", []byte(output+"\n"), os.ModePerm)
	if err != nil {
		log.Fatalln(err)
	}
}

func MinifyMobile() {
	buf, err := os.ReadFile("../assets/css/field-picker.mobile.css")
	if err != nil {
		log.Fatalln(err)
	}

	output, err := CssMinify(string(buf))
	if err != nil {
		log.Fatalln(err)
	}

	err = os.WriteFile("../assets/css/field-picker.mobile.min.css", []byte(output+"\n"), os.ModePerm)
	if err != nil {
		log.Fatalln(err)
	}
}

func main() {
	MinifyDesktop()
	MinifyMobile()
}
