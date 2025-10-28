const { FullConfig } = require('@playwright/test');

class CustomReporter {
  onBegin(config, suite) {
    console.log(`🚀 Starting the run with ${suite.allTests().length} tests`);
  }

  onTestEnd(test, result) {
    console.log(`• ${test.title} — ${result.status.toUpperCase()}`);
  }

  onEnd(result) {
    console.log(`✅ Finished: ${result.status}`);
  }
}

module.exports = CustomReporter;
