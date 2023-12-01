export class Thread {
    date: string | undefined;
    id: string | undefined;

    constructor(obj?: any) {
        this.date = obj ? obj.date : '';
        this.id = obj ? obj.date: '';
    }

    public toJSON() {
        return {
            date: this.date,
            id: this.id
        }
    }
}