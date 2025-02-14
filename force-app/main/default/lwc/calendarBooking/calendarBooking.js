import { LightningElement, track } from 'lwc';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import FLATPICKR from '@salesforce/resourceUrl/flatpickrJs';
import FLATPICKR_CSS from '@salesforce/resourceUrl/flatpickrCss';
import getTimeZones from '@salesforce/apex/BookingController.getTimeZones';
import getAvailableSlots from '@salesforce/apex/BookingController.getAvailableSlots';
import saveBookingDetails from '@salesforce/apex/BookingController.saveBookingDetails';
import cancelBooking from '@salesforce/apex/BookingController.cancelBooking';
import getBookings from '@salesforce/apex/BookingController.getBookings';

export default class CalendarBooking extends LightningElement {
    @track selectedDate = '';
    @track selectedTimeZone = 'Asia/Kolkata'; // Default to IST
    @track timeSlots = [];
    @track timeZones = [];
    flatpickrInitialized = false;

    connectedCallback() {
        this.loadTimeZones();
    }

    loadTimeZones() {
        getTimeZones()
            .then(result => {
                this.timeZones = result.map(zone => ({ label: zone, value: zone }));
            })
            .catch(error => console.error('Error fetching time zones:', error));
    }

    renderedCallback() {
        if (!this.flatpickrInitialized) {
            this.flatpickrInitialized = true;
            Promise.all([loadScript(this, FLATPICKR), loadStyle(this, FLATPICKR_CSS)])
                .then(() => this.initializeFlatpickr())
                .catch(error => console.error('Error loading Flatpickr:', error));
        }
    }

    initializeFlatpickr() {
        const input = this.template.querySelector('.flatpickr-input');
        if (!input) return;

        flatpickr(input, {
            dateFormat: 'Y-m-d',
            minDate: 'today',
            onChange: this.handleDateChange.bind(this)
        });
    }

    handleDateChange(selectedDates) {
        if (selectedDates.length > 0) {
            this.selectedDate = selectedDates[0].toISOString().split('T')[0];
            this.fetchAvailableSlots();
            this.fetchBookings();
        } else {
            this.selectedDate = '';
        }
    }

    fetchAvailableSlots() {
        if (!this.selectedDate) return;

        getAvailableSlots({ selectedDate: this.selectedDate })
            .then(slots => {
                this.timeSlots = slots.map(slot => ({
                    id: slot.Id,
                    time: this.convertToTimeZone(slot.Time_Slot__c), // Convert to selected time zone
                    timeUTC: slot.Time_Slot__c, // Store original UTC time for booking
                    isSelected: false,
                    variant: 'neutral'
                }));
            })
            .catch(error => console.error('Error fetching slots:', error));
    }

    fetchBookings() {
        getBookings({ selectedDate: this.selectedDate })
            .then(bookings => {
                const bookedSlots = bookings.map(booking => booking.Slot_Id__c);
                this.timeSlots = this.timeSlots.filter(slot => !bookedSlots.includes(slot.id));
            })
            .catch(error => console.error('Error fetching bookings:', error));
    }

    convertToTimeZone(slotTime) { 
        if (!slotTime) return '';

        const dateObj = new Date(slotTime);
        return new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: this.selectedTimeZone
        }).format(dateObj);
    }

    convertToUTC(localTime) {
        const dateObj = new Date();
        const timeParts = localTime.match(/(\d+):(\d+)\s(AM|PM)/);
        if (!timeParts) return null;

        let hours = parseInt(timeParts[1], 10);
        const minutes = parseInt(timeParts[2], 10);
        const period = timeParts[3];

        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        dateObj.setHours(hours, minutes, 0, 0);
        return dateObj.toISOString();
    }

    handleTimeZoneChange(event) {
        this.selectedTimeZone = event.target.value;
        this.fetchAvailableSlots();
    }

    handleSlotClick(event) {
        const selectedId = event.target.dataset.id;
        this.timeSlots = this.timeSlots.map(slot => ({
            ...slot,
            isSelected: slot.id === selectedId ? !slot.isSelected : false,
            variant: slot.id === selectedId ? 'brand' : 'neutral'
        }));
    }

    get isBookNowDisabled() {
        return !this.timeSlots.some(slot => slot.isSelected);
    }

    handleBookNow() {
        const selectedSlot = this.timeSlots.find(slot => slot.isSelected);
        if (!selectedSlot) return;

        saveBookingDetails({
            selectedDate: this.selectedDate,
            selectedTime: selectedSlot.timeUTC, // Store UTC time
            slotId: selectedSlot.id,
            timeZone: this.selectedTimeZone
        })
            .then(() => {
                alert(`Booking Confirmed!\nDate: ${this.selectedDate}\nTime: ${selectedSlot.time} (${this.selectedTimeZone})`);
                this.fetchAvailableSlots();
            })
            .catch(error => console.error('Error saving booking:', error));
    }

    handleCancelBooking() {
        const selectedSlot = this.timeSlots.find(slot => slot.isSelected);
        if (!selectedSlot) return;

        cancelBooking({ bookingId: selectedSlot.id, slotId: selectedSlot.id })
            .then(() => {
                alert('Booking Cancelled.');
                this.fetchAvailableSlots();
            })
            .catch(error => console.error('Error cancelling booking:', error));
    }
}
