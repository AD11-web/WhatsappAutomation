const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const path = require('path');
const fs = require('fs');

async function createDriver() {
    let userProfile = path.resolve('C:/Users/ankit/AppData/Local/Google/Chrome/User Data');
    let options = new chrome.Options();
    options.addArguments(`--user-data-dir=${userProfile}`);
    options.addArguments('--profile-directory=Default');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');

    return await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();
}

async function openWhatsAppWeb(driver) {
    await driver.get('https://web.whatsapp.com');
    await driver.wait(until.elementLocated(By.css('span[data-icon="search"]')), 30000);
    console.log("Search icon located successfully.");

    let searchIcon = await driver.findElement(By.css('span[data-icon="search"]'));
    await searchIcon.click();
    console.log("Clicked on the search icon.");
}

async function searchForWord(driver, word) {
    await driver.wait(until.elementLocated(By.css('div[role="textbox"]')), 10000);
    let searchBar = await driver.findElement(By.css('div[role="textbox"]'));
    console.log(`Searching for the word '${word}'...`);
    await searchBar.clear();
    await searchBar.sendKeys(word, Key.RETURN);
    await driver.sleep(5000);
}

async function getChatElements(driver) {
    return await driver.findElements(By.xpath("//div[contains(@class, '_ak8l')]"));
}

async function isValidChatElement(element) {
    try {
        let elementText = await element.getText();
        return !(elementText.includes('See more chat history') || elementText.includes('Get WhatsApp for Windows'));
    } catch (error) {
        console.error('Error checking chat element validity:', error);
        return false;
    }
}

async function processChat(driver, chatElement, wordIndex, chatIndex) {
    try {
        let actions = driver.actions({ async: true });
        await driver.executeScript("arguments[0].scrollIntoView(true);", chatElement);
        await actions.move({ origin: chatElement }).perform();
        await actions.click().perform();
        console.log(`Clicked on valid chat #${chatIndex + 1} containing '${wordIndex + 1}'.`);

        await driver.sleep(3000);

        //  screenshots directory 
        const screenshotsDir = path.resolve(__dirname, 'screenshots');
        if (!fs.existsSync(screenshotsDir)) {
            fs.mkdirSync(screenshotsDir);
        }

        let screenshotPath = path.join(screenshotsDir, `chat_${wordIndex + 1}.${chatIndex + 1}.png`);
        await driver.takeScreenshot().then(image => {
            fs.writeFileSync(screenshotPath, image, 'base64');
            console.log(`Screenshot saved: ${screenshotPath}`);
        });

        await driver.sleep(2000);
    } catch (error) {
        if (error.name === "StaleElementReferenceError") {
            console.log(`StaleElementReferenceError encountered for chat #${chatIndex + 1}. Re-locating element...`);
            throw error;
        } else {
            console.error(`Unexpected error while processing chat #${chatIndex + 1}:`, error);
        }
    }
}

async function refreshPage(driver) {
    console.log(`Refreshing the page for the next search...`);
    await driver.navigate().refresh();
    await driver.wait(until.elementLocated(By.css('span[data-icon="search"]')), 30000);
    console.log("Search icon located successfully after refresh.");
}

async function handleChats(driver, word, callback) {
    await searchForWord(driver, word);
    let chatElements = await getChatElements(driver);
    console.log(`Found ${chatElements.length} chats with the word '${word}'.`);

    for (let chatIndex = 0; chatIndex < chatElements.length; chatIndex++) {
        let chatElement = chatElements[chatIndex];
        console.log(`Processing chat #${chatIndex + 1} with word '${word}'...`);
        if (await isValidChatElement(chatElement)) {
            await processChat(driver, chatElement, word, chatIndex);
            callback(word); //  callback function
        } else {
            console.log(`Skipped invalid element for chat #${chatIndex + 1} with word '${word}'.`);
        }
    }

    await refreshPage(driver);
}

module.exports = {
    createDriver,
    openWhatsAppWeb,
    handleChats
};
