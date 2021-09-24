import { LightningElement, api, track } from 'lwc';
import getFieldsAndRecords from '@salesforce/apex/FieldSetHelper.getFieldsAndRecords';
import deleteActivity from '@salesforce/apex/FieldSetHelper.deleteActivity';
import UpdateActivity from '@salesforce/apex/FieldSetHelper.UpdateActivity';


import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

export default class LwcFieldSetComponent extends LightningElement {
    
    @api recordId;  // record id from record detail page e.g. ''0012v00002WCUdxAAH'
    @api SFDCobjectApiName; //kind of related list object API Name e.g. 'Case'
    @api fieldSetName; // FieldSet which is defined on that above object e.g. 'CaseRelatedListFS'
    @api criteriaFieldAPIName; // This field will be used in WHERE condition e.g.'AccountId'
    @api firstColumnAsRecordHyperLink; //if the first column can be displayed as hyperlink

    @track columns;   //columns for List of fields datatable
    @track tableData;   //data for list of fields datatable
    
    recordCount; //this displays record count inside the ()
    lblobjectName; //this displays the Object Name whose records are getting displayed

    @track sortBy;
    @track sortDirection;
    @track openQuickAction;
    @track isModalOpen = false;
    @track buttonLabel = 'Delete';
    @track button = "update";
    @track isTrue = false;
    @api selectedPickValue ;

    selectedRecords = [];
    refreshTable;
    error;

    get options() {
        return [
            { label: 'Not Started', value: 'Not Started' },
            { label: 'In Progress', value: 'In Progress' },
            { label: 'Completed', value: 'Completed' },
            { label: 'Waiting on someone else', value: 'Waiting on someone else' },
            { label: 'Deferred', value: 'Deferred' }
        ];
    }

    connectedCallback(){
        let firstTimeEntry = false;
        let firstFieldAPI;

        //make an implicit call to fetch records from database
        getFieldsAndRecords({ strObjectApiName: this.SFDCobjectApiName,
                                strfieldSetName: this.fieldSetName,
                                criteriaField: this.criteriaFieldAPIName,
                                criteriaFieldValue: this.recordId})
                
        .then(data=>{        
            //get the entire map
            let objStr = JSON.parse(data);   
            
            /* retrieve listOfFields from the map,
             here order is reverse of the way it has been inserted in the map */
            let listOfFields= JSON.parse(Object.values(objStr)[1]);
            
            //retrieve listOfRecords from the map
            let listOfRecords = JSON.parse(Object.values(objStr)[0]);

            let items = []; //local array to prepare columns

            /*if user wants to display first column has hyperlink and clicking on the link it will
                naviagte to record detail page. Below code prepare the first column with type = url
            */
            listOfFields.map(element=>{
                //it will enter this if-block just once
                if(this.firstColumnAsRecordHyperLink !=null && this.firstColumnAsRecordHyperLink=='Yes'
                                                        && firstTimeEntry==false){
                    firstFieldAPI  = element.fieldPath; 
                    //perpare first column as hyperlink                                     
                    items = [...items ,
                                    {
                                        label: element.label, 
                                        fieldName: 'URLField',
                                        fixedWidth: 150,
                                        type: 'url', 
                                        typeAttributes: { 
                                            label: {
                                                fieldName: element.fieldPath
                                            },
                                            target: '_blank'
                                        },
                                        sortable: true 
                                    }
                    ];
                    firstTimeEntry = true;
                } else {
                    items = [...items ,{label: element.label, 
                        fieldName: element.fieldPath}];
                }   
            });
            //finally assigns item array to columns
            this.columns = items; 
            this.tableData = listOfRecords;

            console.log('listOfRecords',listOfRecords);
            /*if user wants to display first column has hyperlink and clicking on the link it will
                naviagte to record detail page. Below code prepare the field value of first column
            */
            if(this.firstColumnAsRecordHyperLink !=null && this.firstColumnAsRecordHyperLink=='Yes'){
                let URLField;
                //retrieve Id, create URL with Id and push it into the array
                this.tableData = listOfRecords.map(item=>{
                    URLField = '/lightning/r/' + this.SFDCobjectApiName + '/' + item.Id + '/view';
                    return {...item,URLField};                     
                });
                
                //now create final array excluding firstFieldAPI
                this.tableData = this.tableData.filter(item => item.fieldPath  != firstFieldAPI);
            }

            //assign values to display Object Name and Record Count on the screen
            this.lblobjectName = this.SFDCobjectApiName;
            this.recordCount = this.tableData.length;
            this.error = undefined;   
        })
        .catch(error =>{
            this.error = error;
            console.log('error',error);
            this.tableData = undefined;
            this.lblobjectName = this.SFDCobjectApiName;
        })        
    }

    handleSortdata(event) {
        // field name
        this.sortBy = event.detail.fieldName;

        // sort direction
        this.sortDirection = event.detail.sortDirection;

        // calling sortdata function to sort the data based on direction and selected field
        this.sortData(event.detail.fieldName, event.detail.sortDirection);
    }

    sortData(tableData, direction) {
        // serialize the data before calling sort function
        let parseData = JSON.parse(JSON.stringify(this.data));

        // Return the value stored in the field
        let keyValue = (a) => {
            return a[tableData];
        };

        // cheking reverse direction 
        let isReverse = direction === 'asc' ? 1: -1;

        // sorting data 
        parseData.sort((x, y) => {
            x = keyValue(x) ? keyValue(x) : ''; // handling null values
            y = keyValue(y) ? keyValue(y) : '';

            // sorting values based on direction
            return isReverse * ((x > y) - (y > x));
        });

        // set the sorted data to data table data
        this.tableData = parseData;
    
    }
 

    getSelectedRecords(event) {
        // getting selected rows
        const selectedRows = event.detail.selectedRows;
        
        this.recordsCount = event.detail.selectedRows.length;

        // this set elements the duplicates if any
        let conIds = new Set();

        // getting selected record id
        for (let i = 0; i < selectedRows.length; i++) {
            conIds.add(selectedRows[i].Id);
        }

        // coverting to array
        this.selectedRecords = Array.from(conIds);

        window.console.log('selectedRecords ====> ' +this.selectedRecords);
    }


    deleteAccounts() {
        if (this.selectedRecords) {
            // setting values to reactive variables
            this.buttonLabel = 'Processing....';
            this.isTrue = true;

            // calling apex class to delete selected records.
            this.deleteCons();
        }
    }


    deleteCons() {
        deleteActivity({lstCaseIds: this.selectedRecords})
        .then(result => {
            window.console.log('result ====> ' + result);

            this.buttonLabel = 'Delete ';
            this.isTrue = false;

            // showing success message
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success!!', 
                    message: this.recordsCount + ' OpenActivity deleted.', 
                    variant: 'success'
                }),
            );
            
            // Clearing selected row indexs 
            this.template.querySelector('lightning-datatable').selectedRows = [];

            this.recordsCount = 0;

            // refreshing table data using refresh apex
            return refreshApex(this.refreshTable);

        })
        .catch(error => {
            window.console.log(error);
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error while getting Deleting Activities', 
                    message: error.message, 
                    variant: 'error'
                }),
            );
        });
    } 
    
    handleChange(event) {
        this.selectedPickValue = event.detail.value;
        console.log('selectedValue ====> ' +this.selectedPickValue);

    } 

    updateDetails(){
        console.log('selectedValue ====> ' +this.selectedPickValue);
        console.log('selectedRecords ====> ' +this.selectedRecords);


        if (this.selectedRecords) {
            
            this.isTrue = true;
            // calling apex class to delete selected records.
            this.updateEvents();
        }
    }



    updateEvents(){
        console.log(this.selectedRecords);
        console.log(this.selectedPickValue);
        UpdateActivity({lstEventIds: this.selectedRecords ,lstDetails: this.selectedPickValue})
        
        .then(result => {
            window.console.log('result ====> ' + result);

            

            // showing success message
            this.closeModal();
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success!!', 
                    message: this.recordsCount + 'Updated.', 
                    variant: 'success'
                }),
            );
            
            
            // refreshing table data using refresh apex
           // return refreshApex(this.refreshTable);

        })
        .catch(error => {
            window.console.log(error);
            this.closeModal();
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error while getting updating Activities', 
                    message: error.message, 
                    variant: 'error'
                }),
            );
        });
    }


    openModal() {
        // to open modal set isModalOpen tarck value as true
        debugger;
        this.selectedrecordIds = this.template.querySelector('lightning-datatable').getSelectedRows();
        this.openQuickAction = true;
        this.isModalOpen = true; 
    }
    closeModal(event) {
        // to close modal set isModalOpen tarck value as false
        this.selectedIds = [];
        this.isModalOpen = false;
        this.openQuickAction = false;
        this.hasRendered = true;
    }

}