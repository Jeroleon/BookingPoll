import { LightningElement, track, wire } from 'lwc';
import getAvailableYears from '@salesforce/apex/BookingPoll.getAvailableYears';
import getAvailableMonths from '@salesforce/apex/BookingPoll.getAvailableMonths';

export default class CalendarBooking extends LightningElement {
    @track availableYears = [];
    @track availableMonths = [
        
    ];

    @track availableDates = [];
    @track availableSlots = [];
    
    @track selectedYear = null;
    @track selectedMonth = null;
    @track selectedDate = null;
    @track selectedSlot = null;
    
    @track showMonths = false;
    @track showDates = false;
    @track showSlots = false;

    @wire(getAvailableYears)
    wiredYears({ error, data }) {
        if (data) {
            this.availableYears = data.map(year => year.toString()); // Convert integers to strings
        } else if (error) {
            console.error('Error fetching years:', error);
        }
    }


    handleYearChange(event) {
        this.selectedYear = event.target.value;
        this.selectedMonth = null;
        this.selectedDate = null;
        this.selectedSlot = null;
        this.showMonths = true;
        this.showDates = false;
        this.showSlots = false;

        getAvailableMonths({ selectedYear: this.selectedYear })
        .then(data => {
            this.availableMonths = data.map((month, index) => ({
                id: (index + 1).toString(),
                name: month,
                isSelected: false
            }));
        })
        .catch(error => {
            console.error('Error fetching months:', error);
        });

    }

    handleMonthClick(event) {
        const selectedId = event.currentTarget.dataset.id;
        const selectedMonth = this.availableMonths.find(month => month.id === selectedId);
        
        this.availableMonths = this.availableMonths.map(month => ({
            ...month,
            isSelected: month.id === selectedId
        }));

        this.selectedMonth = selectedMonth.name;
        this.selectedDate = null;
        this.selectedSlot = null;
        this.showDates = true;
        this.showSlots = false;

        // Load available dates for the selected month (Example Data)
        this.availableDates = [
            { id: '1', month: selectedMonth.name, date: '14', day: 'Fri' },
            { id: '2', month: selectedMonth.name, date: '18', day: 'Tue' },
            { id: '3', month: selectedMonth.name, date: '27', day: 'Thu' }
        ];
    }

    handleDateClick(event) {
        const selectedId = event.currentTarget.dataset.id;
        const selectedDate = this.availableDates.find(date => date.id === selectedId);

        this.availableDates = this.availableDates.map(date => ({
            ...date,
            isSelected: date.id === selectedId
        }));

        this.selectedDate = selectedDate.date;
        this.selectedSlot = null;
        this.showSlots = true;

        // Load available time slots (Example Data)
        this.availableSlots = [
            { time: '9:00 AM', isSelected: false },
            { time: '11:00 AM', isSelected: false },
            { time: '1:00 PM', isSelected: false },
            { time: '3:00 PM', isSelected: false },
            { time: '5:00 PM', isSelected: false }
        ];
    }

    handleSlotClick(event) {
        const selectedTime = event.currentTarget.dataset.time;

        this.availableSlots = this.availableSlots.map(slot => ({
            ...slot,
            isSelected: slot.time === selectedTime
        }));

        this.selectedSlot = selectedTime;
    }
}
