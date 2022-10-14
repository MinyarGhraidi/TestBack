const {baseModelbo} = require("./basebo");

class TemplateListbo extends baseModelbo{
    constructor() {
        super('templates_list_call_files', 'templates_list_call_files_id');
        this.baseModal = 'templates_list_call_files';
        this.primaryKey = 'templates_list_call_files_id'
    }






}

module.exports = TemplateListbo
