document.addEventListener('DOMContentLoaded', () => {
  const slides = document.querySelectorAll('.slide')
  const prevButton = document.getElementById('prev-slide')
  const nextButton = document.getElementById('next-slide')
  const slideCounter = document.getElementById('slide-counter')
  let currentSlideIndex = 0

  // Elementos para el generador de código
  const codePromptTextarea = document.getElementById('code-prompt')
  const generateCodeBtn = document.getElementById('generate-code-btn')
  const generatedCodePre = document.getElementById('generated-code')
  const codeOutputLoading = document.getElementById('code-output-loading')
  const codeOutputError = document.getElementById('code-output-error')

  // Elementos para el generador de paletas
  const palettePromptTextarea = document.getElementById('palette-prompt')
  const generatePaletteBtn = document.getElementById('generate-palette-btn')
  const generatedPaletteDiv = document.getElementById('generated-palette')
  const paletteOutputLoading = document.getElementById('palette-output-loading')
  const paletteOutputError = document.getElementById('palette-output-error')

  // Function to show the current slide and update the counter
  function showSlide(index) {
    slides.forEach((slide, i) => {
      if (i === index) {
        slide.classList.add('active')
      } else {
        slide.classList.remove('active')
      }
    })
    slideCounter.textContent = `${index + 1} / ${slides.length}`
  }

  // Handler for the "Next" button
  nextButton.addEventListener('click', () => {
    if (currentSlideIndex < slides.length - 1) {
      currentSlideIndex++
      showSlide(currentSlideIndex)
    }
  })

  // Handler for the "Previous" button
  prevButton.addEventListener('click', () => {
    if (currentSlideIndex > 0) {
      currentSlideIndex--
      showSlide(currentSlideIndex)
    }
  })

  // --- Gemini API Integration for Code Generation ---
  generateCodeBtn.addEventListener('click', async () => {
    const prompt = codePromptTextarea.value.trim()
    if (!prompt) {
      codeOutputError.textContent = 'Por favor, introduce una descripción para generar el código.'
      codeOutputError.classList.remove('hidden')
      return
    }

    codeOutputError.classList.add('hidden')
    generatedCodePre.textContent = ''
    codeOutputLoading.classList.remove('hidden')
    generateCodeBtn.disabled = true

    try {
      let chatHistory = []
      chatHistory.push({
        role: 'user',
        parts: [
          {
            text: `Genera el código HTML y CSS para el siguiente componente web. Incluye solo el HTML y CSS, sin envolver en etiquetas <html>, <head>, <body>. Asegúrate de que sea responsivo y siga buenas prácticas. Descripción: "${prompt}"`,
          },
        ],
      })
      const payload = { contents: chatHistory }
      const apiKey = '' // Canvas will provide this at runtime
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()
      if (
        result.candidates &&
        result.candidates.length > 0 &&
        result.candidates[0].content &&
        result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0
      ) {
        const text = result.candidates[0].content.parts[0].text
        generatedCodePre.textContent = text
      } else {
        codeOutputError.textContent = 'No se pudo generar el código. Inténtalo de nuevo con una descripción diferente.'
        codeOutputError.classList.remove('hidden')
      }
    } catch (error) {
      console.error('Error calling Gemini API for code generation:', error)
      codeOutputError.textContent = 'Error de red o del servidor al generar el código. Consulta la consola.'
      codeOutputError.classList.remove('hidden')
    } finally {
      codeOutputLoading.classList.add('hidden')
      generateCodeBtn.disabled = false
    }
  })

  // --- Gemini API Integration for Color Palette Generation ---
  generatePaletteBtn.addEventListener('click', async () => {
    const prompt = palettePromptTextarea.value.trim()
    if (!prompt) {
      paletteOutputError.textContent = 'Por favor, introduce un tema para generar la paleta.'
      paletteOutputError.classList.remove('hidden')
      return
    }

    paletteOutputError.classList.add('hidden')
    generatedPaletteDiv.innerHTML = ''
    paletteOutputLoading.classList.remove('hidden')
    generatePaletteBtn.disabled = true

    try {
      let chatHistory = []
      chatHistory.push({
        role: 'user',
        parts: [
          {
            text: `Genera una paleta de colores moderna y coherente para el siguiente tema. Proporciona el nombre de la paleta y una lista de 4-5 colores, incluyendo su nombre y código hexadecimal. Tema: "${prompt}"`,
          },
        ],
      })

      const payload = {
        contents: chatHistory,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              paletteName: { type: 'STRING' },
              colors: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    name: { type: 'STRING' },
                    hex: { type: 'STRING' },
                  },
                  propertyOrdering: ['name', 'hex'],
                },
              },
            },
            propertyOrdering: ['paletteName', 'colors'],
          },
        },
      }
      const apiKey = '' // Canvas will provide this at runtime
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()
      if (
        result.candidates &&
        result.candidates.length > 0 &&
        result.candidates[0].content &&
        result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0
      ) {
        const json = result.candidates[0].content.parts[0].text
        const parsedJson = JSON.parse(json)

        if (parsedJson.paletteName && parsedJson.colors && Array.isArray(parsedJson.colors)) {
          let htmlOutput = `<h3 class="text-2xl font-semibold text-blue-300 mb-4">${parsedJson.paletteName}</h3>`
          htmlOutput += `<div class="flex flex-wrap gap-4 justify-center">`
          parsedJson.colors.forEach((color) => {
            htmlOutput += `
                            <div class="flex flex-col items-center p-3 rounded-lg shadow-md bg-gray-700">
                                <div class="w-20 h-20 rounded-full border-2 border-gray-600" style="background-color: ${color.hex};"></div>
                                <p class="mt-2 text-md font-medium">${color.name}</p>
                                <p class="text-sm text-gray-400">${color.hex}</p>
                            </div>
                        `
          })
          htmlOutput += `</div>`
          generatedPaletteDiv.innerHTML = htmlOutput
        } else {
          paletteOutputError.textContent = 'La IA no devolvió una estructura de paleta válida. Inténtalo de nuevo.'
          paletteOutputError.classList.remove('hidden')
        }
      } else {
        paletteOutputError.textContent = 'No se pudo generar la paleta. Inténtalo de nuevo con un tema diferente.'
        paletteOutputError.classList.remove('hidden')
      }
    } catch (error) {
      console.error('Error calling Gemini API for palette generation:', error)
      paletteOutputError.textContent = 'Error de red o del servidor al generar la paleta. Consulta la consola.'
      paletteOutputError.classList.remove('hidden')
    } finally {
      paletteOutputLoading.classList.add('hidden')
      generatePaletteBtn.disabled = false
    }
  })

  // Initialize the presentation by showing the first slide
  showSlide(currentSlideIndex)
})
