export class Chat {
    name: string | undefined;
    members: any = [];


    constructor(obj?: any) {
        this.name = obj ? obj.name : '';
        this.members = obj ? obj.members : [];

    }

    public toJSON() {
        return {
            name:  this.name,
            members:  this.members,
        }
    }
}