// service_worker.js

(function() {
    'use strict';
    
    const ServiceWorkerManager = function(url) {
        this.url = url;
        
        this.registerServiceWorker = async () => {
            try {
                // Register the service worker with the given URL
                self.register('service_worker', (registrationCallback) => {
                    console.log('Service worker registered');
                    
                    // Add fetch listener
                    self.addEventListener('fetch', event => {
                        console.log('Fetch request made to:', event.target.url);
                    });
                    
                    registrationCallback.resolve();
                });
            } catch (error) {
                console.error('Service worker registration failed:', error);
            }
        };
        
        this.registerServiceWorker();
    };

    // Export the ServiceWorkerManager class
    self.exports = ServiceWorkerManager;
})();

