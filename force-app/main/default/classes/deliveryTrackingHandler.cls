public with sharing class deliveryTrackingHandler {
    public deliveryTrackingHandler() {
    }

    @AuraEnabled(Cacheable=true)
    public static List<Order__c> getOrders() {
        return [
            SELECT
                Name,
                Account__r.Name,
                Address__c,
                Delivery_Date__c,
                Real_Delivery_Date__c,
                Status__c
            FROM Order__c
            WHERE Status__c = 'Scheduled' OR Status__c = 'Delivered'
        ];
    }
}
