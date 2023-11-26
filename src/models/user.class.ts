export class User {
    name: string | undefined;
    email: string | undefined;
    password: string | undefined;
    id: string | undefined;
    picture: string | undefined;
    online : boolean | undefined;

    constructor(obj?: any) {
        this.name = obj ? obj.name : '';
        this.email = obj ? obj.email : '';
        this.password = obj ? obj.password : '';
        this.id = obj ? obj.id : '';
        this.picture = obj ? obj.picture : '';
        this.online = obj ? obj.online : false;
    }

    public toJSON() {
        return {
            name:  this.name,
            email:  this.email,
            password:  this.password,
            id:  this.id,
            picture:  this.picture,
            online:  this.online
        }
    }
}