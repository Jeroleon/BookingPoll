public with sharing class BookingController {

    // ✅ Save Booking Details
    @AuraEnabled
    public static void saveBookingDetails(String selectedDate, String selectedTime, String slotId, String timeZone) {
        try {
            // Convert selectedDate to Date format
            Date bookingDate = Date.valueOf(selectedDate);

            // Prevent duplicate bookings (check for existing bookings for the same date and slot)
            List<Book_Apt__c> existingBookings = [
                SELECT Id 
                FROM Book_Apt__c 
                WHERE Date__c = :bookingDate AND Slot_Id__c = :slotId AND Status__c = 'Booked'
            ];

            if (!existingBookings.isEmpty()) {
                throw new AuraHandledException('This slot is already booked. Please choose another slot.');
            }

            // Create and insert new booking
            Book_Apt__c booking = new Book_Apt__c();
            booking.Date__c = bookingDate;
            booking.Time__c = selectedTime;
            booking.Slot_Id__c = slotId;
            booking.Status__c = 'Booked';
            booking.Time_Zone__c = timeZone;
            insert booking;

            // Update slot status to 'Booked'
            List<Booking_Slot__c> slots = [
                SELECT Id 
                FROM Booking_Slot__c 
                WHERE Name = :slotId LIMIT 1
            ];
            if (!slots.isEmpty()) {
                Booking_Slot__c slot = slots[0];
                slot.Status__c = 'Booked';
                update slot;
            }

        } catch (Exception e) {
            throw new AuraHandledException('Error saving booking: ' + e.getMessage());
        }
    }

   // ✅ Fetch Available Slots
@AuraEnabled
public static List<Booking_Slot__c> getAvailableSlots(String selectedDate, String timeZone) {
    try {
        // Convert the string selectedDate to a Date object
        Date bookingDate = Date.valueOf(selectedDate);

        // Adjust the booking date based on the time zone (pseudo code, adjust based on your time zone conversion logic)
        Date adjustedDate = adjustDateToTimeZone(bookingDate, timeZone);

        // Fetch available slots for the adjusted date (no quotes around the Date value)
        List<Booking_Slot__c> slots = [
            SELECT Name, Time_Slot__c, Date__c, Status__c
            FROM Booking_Slot__c 
            WHERE Date__c = :adjustedDate AND Status__c = 'Available'
        ];
        
        System.debug('Fetched Slots: ' + slots); // Debug to check if slots are being fetched
        return slots;
    } catch (Exception e) {
        System.debug('Error fetching slots: ' + e.getMessage());
        return new List<Booking_Slot__c>(); // Return empty list in case of error
    }
}

// Adjust the date based on the time zone (this is a basic example, you may need to implement time zone conversion logic)
public static Date adjustDateToTimeZone(Date bookingDate, String timeZone) {
    Integer offset = 0;
    
    // Example logic (you can replace this with more detailed time zone conversion)
    if (timeZone == 'UTC') {
        offset = 0;
    } else if (timeZone == 'IST') {
        offset = 5; // Add 5 hours for IST
    } else if (timeZone == 'PST') {
        offset = -8; // Subtract 8 hours for PST
    }
    
    // Adjust the date by adding/subtracting the offset
    return bookingDate.addDays(offset);
}

    // ✅ Cancel Booking
    @AuraEnabled
    public static void cancelBooking(String bookingId, String slotId) {
        try {
            // Fetch the booking record
            Book_Apt__c booking = [
                SELECT Id, Status__c 
                FROM Book_Apt__c 
                WHERE Id = :bookingId 
                LIMIT 1
            ];
            // Set booking status to 'Cancelled'
            booking.Status__c = 'Cancelled';
            update booking;

            // Mark the associated slot as 'Available'
            List<Booking_Slot__c> slots = [
                SELECT Id 
                FROM Booking_Slot__c 
                WHERE Name = :slotId 
                LIMIT 1
            ]; 
            if (!slots.isEmpty()) {
                Booking_Slot__c slot = slots[0];
                slot.Status__c = 'Available';
                update slot;
            }

        } catch (Exception e) {
            throw new AuraHandledException('Error cancelling booking: ' + e.getMessage());
        }
    }

    // ✅ Fetch Available Time Zones
    @AuraEnabled
    public static List<String> getTimeZones() {
        return new List<String>{'UTC', 'GMT', 'IST', 'EST', 'PST', 'CST', 'MST', 'JST', 'AEDT'};
    }

    // ✅ Fetch Bookings for a Specific Date
    @AuraEnabled
    public static List<Book_Apt__c> getBookings(String selectedDate) {
        try {
            // Convert selectedDate to Date
            Date bookingDate = Date.valueOf(selectedDate);

            // Fetch bookings for the selected date
            List<Book_Apt__c> bookings = [
                SELECT Id, Date__c, Time__c, Slot_Id__c, Status__c, Time_Zone__c 
                FROM Book_Apt__c 
                WHERE Date__c = :bookingDate
            ];

            return bookings;

        } catch (Exception e) {
            System.debug('Error fetching bookings: ' + e.getMessage());
            throw new AuraHandledException('Error fetching bookings: ' + e.getMessage());
        }
    }
}
