export class Chat {
    name: string | undefined;
    members: any = [];
    id: string | undefined;
    type: string;

    constructor(obj?: any) {
        this.name = obj ? obj.name : '';
        this.members = obj ? obj.members : [];
        this.id = obj ? obj.id : '';
        this.type = obj ? obj.type : '';
        
    }

    public toJSON() {
        return {
            name:  this.name,
            members:  this.members,
            id: this.id,
            type: 'direct',
        }
    }
}