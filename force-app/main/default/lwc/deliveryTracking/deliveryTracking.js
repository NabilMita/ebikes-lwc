import { LightningElement, track, wire } from 'lwc';
import getOrders from '@salesforce/apex/DeliveryTrackingHandler.getOrders';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

const actions = [
    { label: 'View', name: 'view' },
    { label: 'Edit', name: 'edit' }
];

const columns = [
    {
        label: 'Name',
        fieldName: 'name',
        type: 'name',
        sortable: true,
        cellAttributes: { class: { fieldName: 'format' } }
    },
    {
        label: 'Account',
        fieldName: 'account',
        type: 'text',
        sortable: true,
        cellAttributes: { class: { fieldName: 'format' } }
    },
    {
        label: 'Address',
        fieldName: 'address',
        type: 'text',
        sortable: true,
        cellAttributes: { class: { fieldName: 'format' } }
    },
    {
        label: 'Expected Delivery Date',
        fieldName: 'expectedDate',
        type: 'Date',
        sortable: true,
        cellAttributes: { class: { fieldName: 'format' } }
    },
    {
        label: 'Real Delivery Date',
        fieldName: 'realDate',
        type: 'Date',
        sortable: true,
        cellAttributes: { class: { fieldName: 'format' } }
    },
    {
        label: 'Status',
        fieldName: 'status',
        type: 'Picklist',
        sortable: true,
        cellAttributes: { class: { fieldName: 'format' } }
    },
    {
        type: 'action',
        typeAttributes: {
            rowActions: actions,
            menuAlignment: 'right'
        }
    }
];

export default class DeliveryTracking extends LightningElement {
    @track data;
    @track columns = columns;
    @track record = [];
    @track bShowModal = false;
    @track currentRecordId;
    @track isEditForm = false;
    @track showLoadingSpinner = false;
    @track isCanceled = false;

    defaultSortDirection = 'asc';
    sortDirection = 'asc';
    sortedBy;
    refreshTable;
    error;

    // Get Orders using wire service
    @wire(getOrders)
    orders(result) {
        this.refreshTable = result;
        if (result.data) {
            this.data = result.data.map((elem) => ({
                ...elem,
                ...{
                    name: elem.Name,
                    account: elem.Account__r.Name,
                    address: elem.Address__c,
                    expectedDate: elem.Delivery_Date__c,
                    realDate: elem.Real_Delivery_Date__c,
                    status: elem.Status__c
                }
            }));
            this.error = undefined;
            this.data.forEach((elem) => {
                elem.format =
                    elem.status === 'Delivered'
                        ? 'slds-box slds-theme_shade slds-theme_alert-texture'
                        : 'slds-theme_default';
            });
        } else if (result.error) {
            this.error = result.error;
            this.data = undefined;
        }
    }

    sortBy(field, reverse, primer) {
        const key = primer
            ? function (x) {
                  return primer(x[field]);
              }
            : function (x) {
                  return x[field];
              };
        return function (a, b) {
            a = key(a);
            b = key(b);
            return reverse * ((a > b) - (b > a));
        };
    }

    onHandleSort(event) {
        const { fieldName: sortedBy, sortDirection } = event.detail;
        const cloneData = [...this.data];

        cloneData.sort(this.sortBy(sortedBy, sortDirection === 'asc' ? 1 : -1));
        this.data = cloneData;
        this.sortDirection = sortDirection;
        this.sortedBy = sortedBy;
    }

    handleRowActions(event) {
        let actionName = event.detail.action.name;

        let row = event.detail.row;
        switch (actionName) {
            case 'view':
                this.viewCurrentRecord(row);
                break;
            case 'edit':
                this.editCurrentRecord(row);
                break;
            default:
        }
    }

    viewCurrentRecord(currentRow) {
        this.bShowModal = true;
        this.isEditForm = false;
        this.record = currentRow;
    }

    closeModal() {
        this.bShowModal = false;
    }

    editCurrentRecord(currentRow) {
        this.bShowModal = true;
        this.isEditForm = true;

        // Assigning record id to the record edit form
        this.currentRecordId = currentRow.Id;
    }

    handleSubmit(event) {
        event.preventDefault();

        // Querying the record edit form and submiting fields to form
        this.template
            .querySelector('lightning-record-edit-form')
            .submit(event.detail.fields);

        // Closing modal
        this.bShowModal = false;

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Delivery Order Status Updated',
                message: 'Status updated Successfully!',
                variant: 'success'
            })
        );
    }

    // Refreshing the datatable after the update
    handleSuccess() {
        return refreshApex(this.refreshTable);
    }
}
