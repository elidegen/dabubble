export class Chat {
    name: string | undefined;
    members: [] | undefined;
    messages: [] | undefined;

    constructor(obj?: any) {
        this.name = obj ? obj.name : '';
        this.members = obj ? obj.members : [];
        this.messages = obj ? obj.messages : [];
    }

    public toJSON() {
        return {
            name:  this.name,
            members:  this.members,
            messages:  this.messages,
        }
    }
}