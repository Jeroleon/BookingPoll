public with sharing class BookingPoll {
    // ✅ Fetch Available Years
    
    @AuraEnabled(cacheable=true)
    public static List<Integer> getAvailableYears() {
        Set<Integer> yearSet = new Set<Integer>();
    
        for (Pooling_Data__c record : [SELECT year__c FROM pooling_Data__c WHERE year__c != NULL]) {
            yearSet.add((Integer) record.year__c);
        }
    
        List<Integer> yearList = new List<Integer>(yearSet);
        yearList.sort();  

        return yearList;
    }
}