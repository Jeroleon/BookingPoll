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

    // ✅ Fetch Available Months
    @AuraEnabled(cacheable=true)
    public static List<String> getAvailableMonths(Integer selectedYear) {
        List<String> monthList = new List<String>();

        // Fetch distinct months for the selected year
        AggregateResult[] results = [SELECT Month__c FROM pooling_Data__c WHERE Year__c = :selectedYear GROUP BY Month__c ORDER BY Month__c ASC];

        for (AggregateResult ar : results) {
            monthList.add((String) ar.get('Month__c'));
        }
        return monthList;
    }

    // ✅ Fetch Available Days
    @AuraEnabled(cacheable=true)
public static List<String> getAvailableDates(Integer selectedYear, String selectedMonth) {
    Set<String> dateSet = new Set<String>();

    for (pooling_Data__c record : [
        SELECT Date__c FROM pooling_Data__c 
        WHERE Year__c = :selectedYear AND Month__c = :selectedMonth 
        ORDER BY Date__c ASC
    ]) {
        dateSet.add(record.Date__c.format()); // Convert to string format
    }

    return new List<String>(dateSet);
}

}