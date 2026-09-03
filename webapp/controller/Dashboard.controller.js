sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/export/Spreadsheet",
    "sap/ui/core/Fragment",
    "sap/ui/core/ValueState",
    "com/nhpc/zhriepfs1/utils/formatter",
    "com/nhpc/zhriepfs1/utils/messenger"
], (Controller, Filter, FilterOperator, Spreadsheet, Fragment, ValueState, formatter, messenger) => {
    "use strict";

    return Controller.extend("com.nhpc.zhriepfs1.controller.Dashboard", {
        formatter: formatter,
        onInit() {
            this.getOwnerComponent().getRouter().getRoute("RouteDashboard").attachPatternMatched(this._onRoutePatternMatched, this);
        },

        _onRoutePatternMatched: function (oEvent) {
            this.getView().getModel().refresh();
        },

        onCreate: function () {
            var oView = this.getView();
            var oModel = this.getView().getModel("viewModel");
            oModel.setProperty("/valueState/selectedType", ValueState.None);
            oModel.setProperty("/valueStateText/selectedType", null);
            oModel.setProperty("/selectedType", null);

            if (!this.oCreateDialog) {
                this.oCreateDialog = Fragment.load({
                    id: oView.getId(),
                    name: "com.nhpc.zhriepfs1.fragment.Create",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    oDialog.open();
                    return oDialog;
                });
            } else {
                this.oCreateDialog.then(function (oDialog) {
                    oDialog.open();
                });
            }
        },

        onComboboxChange: function (oEvent) {
            var oSrc = oEvent.getSource(),
                sValue = oSrc.getSelectedKey();
            if (!sValue) {
                oSrc.setValue(null);
            } else {
                oSrc.setValueState(ValueState.None);
                oSrc.setValueStateText(null);
            }
        },

        onTypeSelect: function () {
            var oViewModel = this.getView().getModel("viewModel");
            var oResourceBundle = this.getResourceBundle();
            var sType = oViewModel.getProperty("/selectedType");
            if (!sType) {
                messenger.error(oResourceBundle.getText("selectTypeErrorMsg"));
                oViewModel.setProperty("/valueState/selectedType", ValueState.Error);
                oViewModel.setProperty("/valueStateText/selectedType", oResourceBundle.getText("selectTypeErrorMsg"));
                return;
            }
            oViewModel.setProperty("/valueState/selectedType", ValueState.None);
            oViewModel.setProperty("/valueStateText/selectedType", null);
            oViewModel.setProperty("/requestDetails/Status", "New");
            oViewModel.setProperty("/requestDetails/StatusText", "New");
            this.oCreateDialog.then(function (oDialog) {
                oDialog.close();
            });
            this.getOwnerComponent().getRouter().navTo("RouteDetail", {
                TransactionId: ""
            });
        },

        onCloseDialog: function () {
            this.oCreateDialog.then(function (oDialog) {
                oDialog.close();
            });
        },

        onListItemPress: function (oEvent) {
            this.getOwnerComponent().getRouter().navTo("RouteDetail", {
                TransactionId:  oEvent.getSource().getBindingContext().getObject("TRANS_ID")
            });
        },

        onDashboardTableUpdateFinish: function (oEvent) {
            var oResourceBundle = this.getResourceBundle(),
                iCount = oEvent.getParameter("total");
            var sTitle = oResourceBundle.getText("eipfRequestTableTitle") + " (" + iCount + ")";
            this.byId("dashBoardTitle").setText(sTitle);
        },

        getResourceBundle: function () {
            return this.getOwnerComponent()
                .getModel("i18n")
                .getResourceBundle();
        },

        onDownload: function (oEvent) {
            var aRows = this.byId("idDashboardTable").getBinding("items"),
                oSettings, oSheet, sFileName = this.getResourceBundle().getText("title"),
                aCols = this.createColumnConfig();

            oSettings = {
                workbook: {
                    columns: aCols
                },
                dataSource: aRows,
                fileType: 'Excel',
                fileName: sFileName
            };
            oSheet = new Spreadsheet(oSettings);
            //oSheet = controls.createSpreadsheet(oSettings);
            oSheet.build().then(function () { }).finally(oSheet.destroy);
        },

        createColumnConfig: function () {
            var aCols = [];
            aCols.push({
                label: this.getResourceBundle().getText("transactionId"),
                property: "TRANS_ID"
            });
            aCols.push({
                label: this.getResourceBundle().getText("type"),
                property: "UPLOAD_TYPE_TEXT"
            });
            aCols.push({
                label: this.getResourceBundle().getText("createdBy"),
                property: "UPLOADED_BY"
            });
            aCols.push({
                label: this.getResourceBundle().getText("createdByName"),
                property: "UPLOADED_BY_NAME"
            });
            aCols.push({
                label: this.getResourceBundle().getText("createdOn"),
                property: "UPLOADED_DATE"
            });
            aCols.push({
                label: this.getResourceBundle().getText("status"),
                property: "STATUS_TEXT"
            });
            return aCols;
        },

        onSearchBtn: function (oEvent) {
            var oTable = this.byId("idDashboardTable");
            let oFilterData = this._getTableFilters();
            oTable.getBinding("items").filter(oFilterData.aFilters);
        },

        _getTableFilters: function (oEvent) {
            var oViewModel = this.getView().getModel("viewModel"),
                oFilterData = oViewModel.getProperty("/filterData"),
                aSearchFilter = [];

            if (oFilterData.TRANS_ID) {
                let aFilters = [];
                aFilters.push(new Filter("TRANS_ID", FilterOperator.Contains, oFilterData.TRANS_ID));
                aSearchFilter.push(new Filter({
                    filters: aFilters,
                    and: false
                }));
            }
            if (oFilterData.UPLOADED_DATE) {
                let aFilters = [];
                aFilters.push(new Filter("UPLOADED_DATE", FilterOperator.EQ, oFilterData.UPLOADED_DATE));
                aSearchFilter.push(new Filter({
                    filters: aFilters,
                    and: false
                }));
            }
            if (oFilterData.STATUS) {
                let aFilters = [];
                aFilters.push(new Filter("STATUS", FilterOperator.EQ, oFilterData.STATUS));
                aSearchFilter.push(new Filter({
                    filters: aFilters,
                    and: false
                }));
            }

            return {
                aFilters: [new Filter({
                    filters: aSearchFilter,
                    and: true
                })]
            }
        },
    });
});