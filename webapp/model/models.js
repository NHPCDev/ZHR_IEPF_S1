sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
], 
function (JSONModel, Device) {
    "use strict";

    return {
        /**
         * Provides runtime information for the device the UI5 app is running on as a JSONModel.
         * @returns {sap.ui.model.json.JSONModel} The device model.
         */
        createDeviceModel: function () {
            var oModel = new JSONModel(Device);
            oModel.setDefaultBindingMode("OneWay");
            return oModel;
        },

        createViewModel: function () {
            var oViewModel = new JSONModel({
                selectedType: "",
                filterData: {
                        "UPLOADED_DATE": null,
                        "STATUS": null,
                        "TRANS_ID": null
                    },
                requestDetails: {
                    Status: "",
                    StatusText: ""
                },
                valueState: {
                    selectedType: "None",
                    // Start of Change: 08.10.2026 : Balamurugan : Financial Year and Month-Year Fields Added
                    finYear:"None",
                    monthYear:"None"
                    // End of Change: 08.10.2026 : Balamurugan : Financial Year and Month-Year Fields Added
                },
                valueStateText: {
                    selectedType: null,
                    // Start of Change: 08.10.2026 : Balamurugan : Financial Year and Month-Year Fields Added
                    finYear: null,
                    monthYear: null
                    // End of Change: 08.10.2026 : Balamurugan : Financial Year and Month-Year Fields Added
                }
            });
            oViewModel.setDefaultBindingMode("TwoWay");
            return oViewModel;
        },

        createDividendModel: function () {
            var oDividendModel = new JSONModel({
                data: []
            });
            oDividendModel.setDefaultBindingMode("TwoWay");
            return oDividendModel;
        },

        createSharesModel: function () {
            var oSharesModel = new JSONModel({
                data: []
            });
            oSharesModel.setDefaultBindingMode("TwoWay");
            return oSharesModel;
        }
    };

});