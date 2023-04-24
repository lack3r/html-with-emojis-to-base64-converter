// Get references to the input and text container elements
const fileInput = document.getElementById("file-input");
const textContainer = document.getElementById("text-container");

// Listen for the user selecting a file
fileInput.addEventListener("change", async () => {
  // Read the contents of the file
  const file = fileInput.files[0];
  const fileReader = new FileReader();
  fileReader.readAsText(file);

  fileReader.onload = async () => {
    // Update the text container with the file contents
    const htmlContent = fileReader.result;
    textContainer.innerHTML = htmlContent;

    // Convert the emojis to base64 images
    await replaceEmojisWithBase64Images();
  };
});

async function emojiToBase64Image(emoji, fontSize) {
    const canvas = document.createElement("canvas");
    canvas.width = fontSize * 1.4;
    canvas.height = fontSize * 1.4;
  
    const ctx = canvas.getContext("2d");
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textBaseline = "top"; // Align text to the top left corner
    ctx.fillText(emoji, 1, 2);
  
    const dataURL = canvas.toDataURL("image/png");
    return dataURL;
  }

async function replaceEmojisWithBase64Images() {
    const textContainer = document.getElementById("text-container");
    const textContent = textContainer.innerHTML;
    const emojiRegex = /(?:[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}](?:\u{FE0F}|\u{FE0E})?)/gu;
    let newTextContent = textContent;

    const style = window.getComputedStyle(textContainer);
    const fontSize = parseInt(style.getPropertyValue("font-size"), 10);

    const emojis = textContent.match(emojiRegex);
    const scalingFactor = 1.2;

    const emojiBase64Map = new Map();

    if (emojis) {
        for (const emoji of emojis) {
            let base64Image = emojiBase64Map.get(emoji);
            if (!base64Image) {
                base64Image = await emojiToBase64Image(emoji, fontSize);
                emojiBase64Map.set(emoji, base64Image);
            }
        }

        for (const [emoji, base64Image] of emojiBase64Map.entries()) {
            newTextContent = newTextContent.split(emoji).join(
                `<span><img src="${base64Image}" alt="${emoji}" style="width: ${fontSize * scalingFactor}px; height: ${fontSize * scalingFactor}px;"></span>`
            );
        }
    }

    const newHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Text with Emojis as Base64 Images</title>
        </head>
        <body>
            <div id="text-container">
                ${newTextContent}
            </div>
        </body>
        </html>
    `;

    const blob = new Blob([newHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    
    // Download the new HTML file
    const link = document.createElement("a");
    link.href = url;
    link.download = "converted.html";
    link.click();
    URL.revokeObjectURL(url);
}

async function loadHTMLFile(filePath) {
    const response = await fetch(filePath);
    if (!response.ok) {
        throw new Error(`Error loading HTML file: ${response.statusText}`);
    }
    const htmlContent = await response.text();
    return htmlContent;
}

async function updateAndDisplayHTML(htmlContent) {
    const textContainer = document.getElementById("text-container");
    const styleTagsToRemove = ['<span>']; // Add other tags to remove, if needed
    const cleanedHtmlContent = removeEmojiStyleTags(htmlContent, styleTagsToRemove);
    textContainer.innerHTML = cleanedHtmlContent;
    await replaceEmojisWithBase64Images();
}


function removeEmojiStyleTags(htmlContent, styleTags) {
    const emojiRegex = /(?:\p{Emoji})(?:\p{Emoji_Modifier})?/gu;
    let result = htmlContent;
    const matches = [...htmlContent.matchAll(/(<[^>]+>)(.+?)(<\/[^>]+>)/g)];

    for (const match of matches) {
        const fullTag = match[0];
        const openTag = match[1];
        const content = match[2];

        if (styleTags.includes(openTag) && emojiRegex.test(content)) {
            result = result.replace(fullTag, content);
        }
    }
    return result;
}


