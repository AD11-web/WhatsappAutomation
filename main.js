const { createDriver, openWhatsAppWeb, handleChats } = require('./whatsappAutomation');


function logSuspiciousWord(word) {
    console.log(`Logged suspicious word: ${word}`);
}

(async function run() {
    let driver = null;

    try {
        driver = await createDriver();
        await openWhatsAppWeb(driver);

        
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('Enter suspicious words (comma-separated): ', async (answer) => {
            rl.close();
            const suspiciousWords = answer.split(',').map(word => word.trim());
            if (!suspiciousWords.length || suspiciousWords[0] === '') {
                console.log("No suspicious words provided. Exiting...");
                await driver.quit();
                return;
            }

            console.log(`Searching for suspicious words: ${suspiciousWords.join(', ')}`);

            for (let wordIndex = 0; wordIndex < suspiciousWords.length; wordIndex++) {
                let word = suspiciousWords[wordIndex];
                await handleChats(driver, word, logSuspiciousWord);
            }

            await driver.quit();
            console.log("Browser closed successfully.");
        });
    } catch (err) {
        console.error('Error:', err);
        if (driver) {
            await driver.quit();
        }
    }
})();
