import { LightningElement, wire, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

// Lightning Message Service and a message channel
import { NavigationMixin } from 'lightning/navigation';
import { subscribe, MessageContext } from 'lightning/messageService';
import PRODUCT_SELECTED_MESSAGE from '@salesforce/messageChannel/ProductSelected__c';

// Utils to extract field values
import { getFieldValue } from 'lightning/uiRecordApi';

// Product__c Schema
import PRODUCT_OBJECT from '@salesforce/schema/Product__c';
import NAME_FIELD from '@salesforce/schema/Product__c.Name';
import PICTURE_URL_FIELD from '@salesforce/schema/Product__c.Picture_URL__c';
import CATEGORY_FIELD from '@salesforce/schema/Product__c.Category__c';
import LEVEL_FIELD from '@salesforce/schema/Product__c.Level__c';
import MSRP_FIELD from '@salesforce/schema/Product__c.MSRP__c';
import BATTERY_FIELD from '@salesforce/schema/Product__c.Battery__c';
import CHARGER_FIELD from '@salesforce/schema/Product__c.Charger__c';
import MOTOR_FIELD from '@salesforce/schema/Product__c.Motor__c';
import MATERIAL_FIELD from '@salesforce/schema/Product__c.Material__c';
import FOPK_FIELD from '@salesforce/schema/Product__c.Fork__c';
import FRONT_BRAKES_FIELD from '@salesforce/schema/Product__c.Front_Brakes__c';
import REAR_BRAKES_FIELD from '@salesforce/schema/Product__c.Rear_Brakes__c';

/**
 * Component to display details of a Product__c.
 */
export default class ProductCard extends NavigationMixin(LightningElement) {
    // Exposing fields to make them available in the template
    categoryField = CATEGORY_FIELD;
    levelField = LEVEL_FIELD;
    msrpField = MSRP_FIELD;
    batteryField = BATTERY_FIELD;
    chargerField = CHARGER_FIELD;
    motorField = MOTOR_FIELD;
    materialField = MATERIAL_FIELD;
    forkField = FOPK_FIELD;
    frontBrakesField = FRONT_BRAKES_FIELD;
    rearBrakesField = REAR_BRAKES_FIELD;

    // Id of Product__c to display
    recordId;

    // Product fields displayed with specific format
    productName;
    productPictureUrl;

    orderId;

    /** Load context for Lightning Messaging Service */
    @wire(MessageContext) messageContext;

    /** Subscription for ProductSelected Lightning message */
    productSelectionSubscription;

    connectedCallback() {
        // Subscribe to ProductSelected message
        this.productSelectionSubscription = subscribe(
            this.messageContext,
            PRODUCT_SELECTED_MESSAGE,
            (message) => this.handleProductSelected(message.productId)
        );
    }

    handleRecordLoaded(event) {
        const { records } = event.detail;
        const recordData = records[this.recordId];
        this.productName = getFieldValue(recordData, NAME_FIELD);
        this.productPictureUrl = getFieldValue(recordData, PICTURE_URL_FIELD);
    }

    /**
     * Handler for when a product is selected. When `this.recordId` changes, the
     * lightning-record-view-form component will detect the change and provision new data.
     */
    handleProductSelected(productId) {
        this.recordId = productId;
    }

    handleNavigateToRecord() {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.recordId,
                objectApiName: PRODUCT_OBJECT.objectApiName,
                actionName: 'view'
            }
        });
    }

    @track openModal = false;

    openModalHandler() {
        this.openModal = true;
    }
    cancelModal() {
        this.openModal = false;
    }

    handleOrderSuccess(event) {
        // Creating new Record in Reseller Order (Order__c)
        this.orderId = event.detail.id;
        console.info('New Reseller Order created with id:' + this.orderId);

        // For testing purpose I used only 1 product, but you can use more than one product & more than one order item
        this.template
            .querySelectorAll(
                'lightning-input-field[data-id="resellerOrderId"]'
            )
            .forEach((field) => {
                // Assigning the new created Reseller Order Id to the Order Item in each form in the modal
                field.value = this.orderId;
            });

        this.template
            .querySelectorAll(
                'lightning-record-edit-form[data-id="orderItemForm"]'
            )
            .forEach((form) => {
                // Creating new OrderItem record for each Order Item form
                form.submit();
            });
    }

    handleOrderItemSuccess() {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Order Created',
                message: 'Order #' + this.orderId + ' created Successfully!',
                variant: 'success'
            })
        );
        this.navigateToNewResellerOrder();
    }

    navigateToNewResellerOrder() {
        // View the new created Reseller Order
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.orderId,
                actionName: 'view'
            }
        });
    }

    handleSave() {
        console.info('Saving..');
        this.template
            .querySelector('lightning-record-edit-form[data-id="orderForm"]')
            .submit(); // Saving the Reseller Order
    }
}
