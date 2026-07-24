import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const userDataDir = path.resolve(process.cwd(), 'playwright_data');

export async function generateChatGPTImage(imagePath: string, prompt: string, title: string): Promise<string> {
  const headless = process.env.PLAYWRIGHT_HEADLESS === 'true';
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless,
    permissions: ['clipboard-read', 'clipboard-write']
  });

  const page = await context.newPage();
  try {
    await page.goto("https://chatgpt.com/");

    // Wait for the chat input
    const chatInputSelector = '#prompt-textarea';
    try {
      await page.waitForSelector(chatInputSelector, { timeout: 30000 });
    } catch (e) {
      throw new Error("Could not find ChatGPT input. Are you logged in? Set PLAYWRIGHT_HEADLESS=false in your .env, run the server, and log in to ChatGPT first.");
    }

    // Upload cover image
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      await fileInput.setInputFiles(imagePath);
      await page.waitForTimeout(3000); // Wait for upload to process
    }

    // Set prompt text safely using evaluate
    await page.evaluate((text) => {
      const el = document.querySelector('#prompt-textarea');
      if (el) {
        el.innerHTML = `<p>${text}</p>`;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, prompt);

    await page.waitForTimeout(1000);
    await page.keyboard.press('Enter');

    console.log("Waiting for ChatGPT to generate the image...");
    
    // DALL-E images in ChatGPT usually load inside assistant messages
    // Wait up to 2 minutes for the generation
    await page.waitForSelector('div[data-message-author-role="assistant"] img:not([alt*="profile"])', { timeout: 120000 });
    await page.waitForTimeout(5000); // Additional buffer to ensure full load

    const images = await page.$$('div[data-message-author-role="assistant"] img:not([alt*="profile"])');
    if (images.length === 0) throw new Error("Image not found in ChatGPT response.");
    
    const lastImage = images[images.length - 1];
    const imageUrl = await lastImage.getAttribute('src');
    if (!imageUrl) throw new Error("Image URL not found on the generated image.");

    // Fetch image as Base64 Data URL
    const dataUrl = await page.evaluate(async (imgUrl) => {
      const res = await fetch(imgUrl);
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    }, imageUrl);

    return dataUrl as string;
  } finally {
    await page.close();
    await context.close();
  }
}

export async function generateChatGPTText(prompt: string): Promise<string> {
  const headless = process.env.PLAYWRIGHT_HEADLESS === 'true';
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless
  });

  const page = await context.newPage();
  try {
    await page.goto("https://chatgpt.com/");

    const chatInputSelector = '#prompt-textarea';
    try {
      await page.waitForSelector(chatInputSelector, { timeout: 30000 });
    } catch (e) {
      throw new Error("Could not find ChatGPT input. Are you logged in? Set PLAYWRIGHT_HEADLESS=false in your .env, run the server, and log in to ChatGPT first.");
    }
    
    // Using evaluate to bypass slow typing for potentially large text like lyrics
    await page.evaluate((text) => {
      const el = document.querySelector('#prompt-textarea');
      if (el) {
        // Replace newlines with <br> for contenteditable structure
        el.innerHTML = text.split('\\n').map(line => `<p>${line}</p>`).join('');
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, prompt);
    
    await page.waitForTimeout(1000);
    await page.keyboard.press('Enter');

    console.log("Waiting for ChatGPT to generate text...");
    // Wait for the send button to be visible again, indicating generation finished
    await page.waitForSelector('button[data-testid="send-button"]', { timeout: 120000, state: 'visible' });
    await page.waitForTimeout(2000);

    const messages = await page.$$('div[data-message-author-role="assistant"]');
    if (messages.length === 0) throw new Error("No response found from ChatGPT.");
    const lastMessage = messages[messages.length - 1];
    const text = await lastMessage.innerText();
    
    return text;
  } finally {
    await page.close();
    await context.close();
  }
}
