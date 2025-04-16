export class util {
    static generateRandomCode(length: number) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    // Helper function to format the date as required (yyyy-MM-ddTHH:mm:ssZ)
    static formatDate(date) {
        return date.toISOString().split('.')[0] + 'Z';
    }

    static formatTime(date: Date): string {
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    static parseTime(datetime: string): Date {
        const [datePart, timePart] = datetime.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes, seconds] = timePart.split(':').map(Number);

        // Create a date object without adjusting for UTC (use local time)
        const localDate = new Date();
        localDate.setFullYear(year, month - 1, day);  // months are zero-indexed
        localDate.setHours(hours, minutes, seconds, 0); // Set hours, minutes, seconds

        return localDate;
    }


    static convertToLocalString(date: string, time: string) {
        // Combine date and time to form the full datetime string for both "from" and "to"
        const fromDateTime = `${date}T${time}`;

        // Create Date objects based on local time
        const fromDateObj = new Date(fromDateTime);

        // Manually format the local date string to match ISO format (without UTC conversion)
        const from = `${fromDateObj.getFullYear()}-${String(fromDateObj.getMonth() + 1).padStart(2, '0')}-${String(fromDateObj.getDate()).padStart(2, '0')}T${String(fromDateObj.getHours()).padStart(2, '0')}:${String(fromDateObj.getMinutes()).padStart(2, '0')}:${String(fromDateObj.getSeconds()).padStart(2, '0')}.000`;

        console.log("$1, $2 => $3", date, time, from);
        return new Date(from);
    }
}