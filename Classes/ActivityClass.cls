public inherited sharing class ActivityClass {
    
    @AuraEnabled(Cacheable = true)
    public static List<Task> getActivity(string CaseLd){ 
        return  [SELECT Id, Subject,Priority,ActivityDate, Status,What.Type, whatId FROM Task WHERE What.Type IN ('Case') And  whatId=: CaseLd];
       
    }


    @AuraEnabled
    public static void deleteActivity(list<Id> lstCaseIds){
        try {
           list<Task> eventToDelete = new list<Task>();

           
            for(Id idCase : lstCaseIds) {
                eventToDelete.add(new Task(Id = idCase));  
            }
            if(!eventToDelete.isEmpty()) {
                delete eventToDelete;
            }  
        }
        catch(Exception ex) {
            throw new AuraHandledException(ex.getMessage());
        }
    }

    @AuraEnabled
    public static void UpdateActivity(list<Id> lstEventIds, string lstDetails){
        system.debug(lstEventIds);
        system.debug(lstDetails);
        try {
           list<Task> eventToDelete = new list<Task>();

           
            for(Id idCase : lstEventIds) {
                eventToDelete.add(new Task(Id = idCase, Status = lstDetails));  
            }
            if(!eventToDelete.isEmpty()) {
                Update eventToDelete;
            }  
        }
        catch(Exception ex) {
            throw new AuraHandledException(ex.getMessage());
        }
    }


    
}
