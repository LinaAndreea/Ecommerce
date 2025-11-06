const fs = require('fs');

/**
 * Data Persistence Service - Single Responsibility: Handle data storage
 * Follows SRP by only managing data persistence operations
 */
class DataPersistenceService {
    constructor(configService) {
        this.config = configService;
    }

    saveUserCredentials(userData) {
        const filePath = this.config.get('testDataPath');
        const dataToSave = {
            email: userData.email,
            password: userData.password,
            timestamp: Date.now()
        };
        
        fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));
        return dataToSave;
    }

    loadUserCredentials() {
        const filePath = this.config.get('testDataPath');
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
        return null;
    }
}

module.exports = { DataPersistenceService };
