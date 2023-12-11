export class Chat {
    name: string | undefined;
    members: any = [];
    id: string | undefined;


    constructor(obj?: any) {
        this.name = obj ? obj.name : '';
        this.members = obj ? obj.members : [];
        this.id = obj ? obj.id : '';
    }

    public toJSON() {
        return {
            name:  this.name,
            members:  this.members,
            id: this.id,
        }
    }
}