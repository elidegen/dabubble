export class Chat {
    name: string | undefined;
    members: any = [];
    id: string | undefined;
    unread: boolean | undefined;


    constructor(obj?: any) {
        this.name = obj ? obj.name : '';
        this.members = obj ? obj.members : [];
        this.id = obj ? obj.id : '';
        this.unread = obj ? obj.unread : false;
    }

    public toJSON() {
        return {
            name:  this.name,
            members:  this.members,
            id: this.id,
            unread: this.unread,
        }
    }
}