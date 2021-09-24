public with sharing class FieldSetHelper {
    @AuraEnabled (cacheable=true)
    public static String getFieldsAndRecords(String strObjectApiName, String strfieldSetName,
                                             String criteriaField, String criteriaFieldValue){
        Map<String, String> returnMap = new Map<String,String>();
        if(!String.isEmpty(strObjectApiName) && !String.isEmpty(strfieldSetName)){
            //get fields from FieldSet
            SObject sObj = (SObject)(Type.forName('Schema.'+ strObjectApiName).newInstance());
            List<Schema.FieldSetMember> lstFSMember = 
                sObj.getSObjectType().getDescribe().fieldSets.getMap().get(strfieldSetName).getFields();

	    //prepare SOQL query based on fieldAPIs	
	    String query = 'SELECT ';
	    for(Schema.FieldSetMember f : lstFSMember) {
	        query += f.getFieldPath() + ', ';
            }
            query += 'Id FROM ' + strObjectApiName ;

            //Just in case criteria field not specified then it will return all records
            if(!(String.isEmpty(criteriaField) && String.isEmpty(criteriaFieldValue))){
                query += ' WHERE ' + criteriaField + '=\'' + criteriaFieldValue + '\'';
            }
                        
	    //execute query
             List<SObject> lstRecords = Database.query(query);
            
             //prepare a map which will hold fieldList and recordList and return it
	     returnMap.put('FIELD_LIST', JSON.serialize(lstFSMember));
	     returnMap.put('RECORD_LIST', JSON.serialize(lstRecords));
	     return JSON.serialize(returnMap);
        }
        return null;
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