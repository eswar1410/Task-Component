import {LightningElement, wire, track, api} from 'lwc';

// importing apex class methods
import getActivity from '@salesforce/apex/ActivityClass.getActivity';

import deleteActivity from '@salesforce/apex/ActivityClass.deleteActivity';
import UpdateActivity from '@salesforce/apex/ActivityClass.UpdateActivity';

import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';


// datatable columns with row actions
const columns = [
     {
        label: 'Subject',
        fieldName: 'Subject',
        sortable: "true"
    },
    {
        label: 'Priority',
        fieldName: 'Priority',
        sortable: "true"
    },
    {
        label: 'Due Date',
        fieldName: 'ActivityDate',
        sortable: "true"
    },
    {
        label: 'Status',
        fieldName: 'Status',
        sortable: "true"
    }

];

export default class DataTableWithSortingInLWC extends LightningElement { 
    // reactive variable
    @track data;
    @track columns = columns;
    @track sortBy;
    @track sortDirection;
    @api recordId;

    @track openQuickAction;
    @track isModalOpen = false;

    @track buttonLabel = 'Delete';
    @track button = "update";
    @track isTrue = false;
    @track recordsCount = 0;
    @api selectedPickValue ;

    selectedRecords = [];
    refreshTable;
    error;

    // retrieving the data using wire service
    @wire(getActivity,{CaseLd: '$recordId'})
    activities(result) {
            this.refreshTable = result;
        if (result.data) {
            this.data = result.data;
            this.error = undefined;

        } else if (result.error) {
            this.error = result.error;
            this.data = undefined;
        }
    }




    get options() {
        return [
            { label: 'Not Started', value: 'Not Started' },
            { label: 'In Progress', value: 'In Progress' },
            { label: 'Completed', value: 'Completed' },
            { label: 'Waiting on someone else', value: 'Waiting on someone else' },
            { label: 'Deferred', value: 'Deferred' }
        ];
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

    handleSortdata(event) {
        // field name
        this.sortBy = event.detail.fieldName;

        // sort direction
        this.sortDirection = event.detail.sortDirection;

        // calling sortdata function to sort the data based on direction and selected field
        this.sortData(event.detail.fieldName, event.detail.sortDirection);
    }

    sortData(fieldname, direction) {
        // serialize the data before calling sort function
        let parseData = JSON.parse(JSON.stringify(this.data));

        // Return the value stored in the field
        let keyValue = (a) => {
            return a[fieldname];
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
        this.data = parseData;
    
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

    // delete records process function
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


    

}
