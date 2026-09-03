sap.ui.define([
    "sap/ui/core/UIComponent",
    "com/nhpc/zhriepfs1/model/models",
    "com/nhpc/zhriepfs1/utils/messenger"
], (UIComponent, models, Messenger) => {
    "use strict";

    return UIComponent.extend("com.nhpc.zhriepfs1.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");
            this.setModel(models.createViewModel(), "viewModel");
            this.setModel(models.createDividendModel(), "dividendModel");
            this.setModel(models.createSharesModel(), "sharesModel");

            // enable routing
            this.getRouter().initialize();
            Messenger.init(this);
        }
    });
});