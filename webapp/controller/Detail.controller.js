sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/export/Spreadsheet",
    "com/nhpc/zhriepfs1/utils/messenger",
    "com/nhpc/zhriepfs1/utils/formatter",
    "sap/ui/core/BusyIndicator"
], (Controller, Filter, FilterOperator, Spreadsheet, messenger, Formatter, BusyIndicator) => {
    "use strict";

    return Controller.extend("com.nhpc.zhriepfs1.controller.Dashboard", {
        formatter: Formatter,
        onInit() {
            this.getOwnerComponent().getRouter().getRoute("RouteDetail").attachPatternMatched(this._onRoutePatternMatched, this);
        },

        _onRoutePatternMatched: function (oEvent) {
            var oArgs = oEvent.getParameter("arguments");
            var sTransactionId = oArgs.TransactionId;
            var oViewModel = this.getView().getModel("viewModel");
            oViewModel.setProperty("/TransactionId", sTransactionId);
            this.getView().getModel("sharesModel").setProperty("/data", []);
            this.getView().getModel("dividendModel").setProperty("/data", []);
            if (sTransactionId) {
                this.getTransactionDetails(sTransactionId);
            } else {
                if(!oViewModel.getProperty("/selectedType")) {
                    this.getOwnerComponent().getRouter().navTo("RouteDashboard", {}, {}, true);
                }else{
                    this.byId("objPageHeader").setText(this.getResourceBundle().getText("iepfRequestPage"));
                    this.byId("objPageHeader1").setText(this.getResourceBundle().getText("iepfRequestPage"));
                    this.getDefaultEmployeeDetails();
                }              
            }
        },

        getDefaultEmployeeDetails: function () {
            var oModel = this.getView().getModel(),
                oViewModel = this.getView().getModel("viewModel");
            BusyIndicator.show(0);
            oViewModel.setProperty("/TransactionId", "");
            oModel.read("/HeaderSet", {
                urlParameters: {
                    "$expand": "HeaderToShares,HeaderToDividend"
                },
                success: function (oResp) {
                    BusyIndicator.hide();
                    if (oResp.results && oResp.results.length > 0) {
                        var oViewModel = this.getView().getModel("viewModel");
                        oViewModel.setProperty("/requestDetails/EmployeeId", oResp.results[0].EMP_ID);
                        oViewModel.setProperty("/requestDetails/EmployeeName", oResp.results[0].EMP_NAME);
                        oViewModel.setProperty("/requestDetails/CompanyCode", oResp.results[0].BUKRS);
                        oViewModel.setProperty("/requestDetails/EmployeeGrade", oResp.results[0].EMP_GRADE_CODE);
                        oViewModel.setProperty("/requestDetails/EmployeeSubgrp", oResp.results[0].EMP_SUB_GROUP);
                        oViewModel.setProperty("/requestDetails/EmployeeSubgrpText", oResp.results[0].EMP_SUB_GROUP_TEXT);
                        oViewModel.setProperty("/requestDetails/PersonnelSubArea", oResp.results[0].EMP_SUB_AREA);
                        oViewModel.setProperty("/requestDetails/PersonnelSubAreaText", oResp.results[0].EMP_SUB_AREA_TEXT);
                        oViewModel.setProperty("/requestDetails/Department", oResp.results[0].EMP_DEPT);
                        oViewModel.setProperty("/requestDetails/PositionText", oResp.results[0].EMP_POSITION);

                        var oRespData = $.extend(true, {}, oResp.results[0]);
                        this.setTransactionData(oRespData);
                    }
                }.bind(this),
                error: function (oError) {
                    BusyIndicator.hide();
                    messenger.error(JSON.parse(oError.responseText).error.message.value, function () {
                        this.getOwnerComponent().getRouter().navTo("RouteDashboard", {}, {}, true);
                    }.bind(this));
                }.bind(this)
            })
        },

        getTransactionDetails: function (sTransactionId) {
            var oModel = this.getView().getModel(),
                oViewModel = this.getView().getModel("viewModel"),
                aFilters = [];

            BusyIndicator.show(0);
            aFilters.push(new Filter("TRANS_ID", FilterOperator.EQ, sTransactionId));
            oModel.read("/HeaderSet", {
                filters: aFilters,
                urlParameters: {
                    "$expand": "HeaderToShares,HeaderToDividend"
                },
                success: function (oResp) {
                    BusyIndicator.hide();
                    if (oResp.results && oResp.results.length > 0) {
                        oViewModel.setProperty("/selectedType", oResp.results[0].UPLOAD_TYPE);
                        oViewModel.setProperty("/requestDetails/Status", oResp.results[0].STATUS);
                        oViewModel.setProperty("/requestDetails/StatusText", oResp.results[0].STATUS_TEXT);
                        oViewModel.setProperty("/requestDetails/EmployeeId", oResp.results[0].EMP_ID);
                        oViewModel.setProperty("/requestDetails/EmployeeName", oResp.results[0].EMP_NAME);
                        oViewModel.setProperty("/requestDetails/CompanyCode", oResp.results[0].BUKRS);
                        oViewModel.setProperty("/requestDetails/EmployeeGrade", oResp.results[0].EMP_GRADE_CODE);
                        oViewModel.setProperty("/requestDetails/EmployeeSubgrp", oResp.results[0].EMP_SUB_GROUP);
                        oViewModel.setProperty("/requestDetails/EmployeeSubgrpText", oResp.results[0].EMP_SUB_GROUP_TEXT);
                        oViewModel.setProperty("/requestDetails/PersonnelSubArea", oResp.results[0].EMP_SUB_AREA);
                        oViewModel.setProperty("/requestDetails/PersonnelSubAreaText", oResp.results[0].EMP_SUB_AREA_TEXT);
                        oViewModel.setProperty("/requestDetails/Department", oResp.results[0].EMP_DEPT);
                        oViewModel.setProperty("/requestDetails/PositionText", oResp.results[0].EMP_POSITION);
                        this.byId("objPageHeader").setText(this.getResourceBundle().getText("createdIEPFRequest", [sTransactionId]));
                        this.byId("objPageHeader1").setText(this.getResourceBundle().getText("createdIEPFRequest", [sTransactionId]));
                        var oRespData = $.extend(true, {}, oResp.results[0]);
                        this.setTransactionData(oRespData);
                    }
                }.bind(this),
                error: function (oError) {
                    BusyIndicator.hide();
                    messenger.error(JSON.parse(oError.responseText).error.message.value, function () {
                        this.getRouter().navTo("RouteDashboard", {}, {}, true);
                    }.bind(this));
                }.bind(this)
            });

        },

        getResourceBundle: function () {
            return this.getOwnerComponent()
                .getModel("i18n")
                .getResourceBundle();
        },

        processUploadedData: function (data) {
            let oViewModel = this.getView().getModel("viewModel");
            var oResourceBundle = this.getResourceBundle();
            let selectedType = oViewModel.getProperty("/selectedType");
            if (!data || data.length === 0) {
                messenger.error(oResourceBundle.getText("noDataFoundInFileMsg"));
                return;
            }
            const requiredColumns = [
                "DP_ID_CLIENT_ID_FOLIO_NO",
                "INVESTORS_NAME"
            ];
            const invalidRows = [];
            data.forEach(function (row, index) {
                const missingFields = requiredColumns.filter(function (column) {
                    return row[column] == null || String(row[column]).trim() === "";
                });
                if (missingFields.length > 0) {
                    invalidRows.push(
                        `${oResourceBundle.getText("row")}${index + 2}: ${missingFields.join(", ")}`
                    );
                }
            });
            if (invalidRows.length > 0) {
                messenger.error(
                    oResourceBundle.getText("missingRequiredFieldsMsg") +
                    invalidRows.join("\n")
                );
                return;
            }
            data = data.map(function (row) { const newRow = {}; Object.keys(row).forEach(function (key) { newRow[key] = row[key] == null ? "" : String(row[key]); }); return newRow; });
            this._uploadedData = data;
            if (selectedType === "S") {
                this.getView().getModel("sharesModel").setProperty("/data", data);
                const oTable = this.byId("idSharesTable");
                const oRowMode = oTable.getRowMode();
                const iCount = this.getView().getModel("sharesModel").getProperty("/data").length;
                if (iCount > 0) {
                    oRowMode.setRowCount(Math.min(iCount, 5));
                }
            } else if (selectedType === "D") {
                this.getView().getModel("dividendModel").setProperty("/data", data);
                const oTable = this.byId("idDividendTable");
                const oRowMode = oTable.getRowMode();
                const iCount = this.getView().getModel("dividendModel").getProperty("/data").length;
                if (iCount > 0) {
                    oRowMode.setRowCount(Math.min(iCount, 5));
                }
            }
            messenger.success(data.length + " " + oResourceBundle.getText("recordsUploadedSuccessfullyMsg"));
            this.getView().getModel("viewModel").refresh(true);
        },

        onDownload: function () {
            const sSelectedType = this.getView().getModel("viewModel").getProperty("/selectedType");
            var oResourceBundle = this.getResourceBundle();
            let aData = [];
            let aColumns = [];
            if (sSelectedType === "S") {
                aData = this.getView().getModel("sharesModel").getProperty("/data");
                aColumns = [
                    {
                        label: oResourceBundle.getText("dpIdClientIdFolioNo"),
                        property: "DP_ID_CLIENT_ID_FOLIO_NO"
                    },
                    {
                        label: oResourceBundle.getText("investorsName"),
                        property: "INVESTORS_NAME"
                    },
                    {
                        label: oResourceBundle.getText("totalShares"),
                        property: "TOTAL_SHARES"
                    },
                    {
                        label: oResourceBundle.getText("remarks"),
                        property: "REMARKS"
                    }
                ];
            } else {
                aData = this.getView().getModel("dividendModel").getProperty("/data");
                aColumns = [
                    {
                        label: oResourceBundle.getText("dpIdClientIdFolioNo"),
                        property: "DP_ID_CLIENT_ID_FOLIO_NO"
                    },
                    {
                        label: oResourceBundle.getText("investorsName"),
                        property: "INVESTORS_NAME"
                    },
                    {
                        label: oResourceBundle.getText("dividendAmount"),
                        property: "DIVIDEND_AMOUNT"
                    },
                    {
                        label: oResourceBundle.getText("address1"),
                        property: "ADDRESS1"
                    },
                    {
                        label: oResourceBundle.getText("address2"),
                        property: "ADDRESS2"
                    },
                    {
                        label: oResourceBundle.getText("address3"),
                        property: "ADDRESS3"
                    },
                    {
                        label: oResourceBundle.getText("address4"),
                        property: "ADDRESS4"
                    },
                    {
                        label: oResourceBundle.getText("pin"),
                        property: "PIN"
                    },
                    {
                        label: oResourceBundle.getText("dueDate"),
                        property: "Due_Date"
                    },
                    {
                        label: oResourceBundle.getText("remarks"),
                        property: "REMARKS"
                    }
                ];
            }
            if (!aData.length) {
                messenger.error(oResourceBundle.getText("noDataToDownloadMsg"));
                return;
            }
            const oSettings = {
                workbook: {
                    columns: aColumns,
                    context: {
                        sheetName: sSelectedType === "S" ? oResourceBundle.getText("sharesSheetName") : oResourceBundle.getText("dividendSheetName")
                    }
                },
                dataSource: aData,
                fileName: sSelectedType === "S" ? oResourceBundle.getText("sharesTemplateDownloadReportFileName") : oResourceBundle.getText("dividendTemplateDownloadReportFileName")
            };
            const oSpreadsheet = new Spreadsheet(oSettings);
            oSpreadsheet.build().finally(function () {
                oSpreadsheet.destroy();
            });
        },

        handleInterimSubmitBtnPress: function (oEvent) {
            var oResourceBundle = this.getResourceBundle(),
                sTitle = oResourceBundle.getText("CONFIRM_TITLE"),
                bProceed = this.validateSubmitRequestDetails(),
                sText = oResourceBundle.getText("CONFIRM_TEXT_INTERIM_REQUEST");
            this.sActionFlag = "Interim";
            if (bProceed) {
                messenger.confirm(sTitle, sText, "Confirm", null, function () {
                    BusyIndicator.show(0);
                    var oModel = this.getView().getModel(),
                        oPayload = this.createRequestPayload();
                    oModel.create("/HeaderSet", oPayload, {
                        success: function (oResp) {
                            if (oResp.TRANS_ID) {
                                this.TRANS_ID = oResp.TRANS_ID;
                                BusyIndicator.hide();
                                messenger.success(oResourceBundle.getText("iepfRequestInterimSuccessMsg", oResp.TRANS_ID), () => {
                                    this.getOwnerComponent().getRouter().navTo("RouteDashboard", {}, {}, true);
                                });
                            }
                        }.bind(this),
                        error: function (oError) {
                            BusyIndicator.hide();
                            messenger.error(JSON.parse(oError.responseText).error.message.value);
                        }.bind(this)
                    });
                }.bind(this));
            }
        },

        createRequestPayload: function () {
            var oViewModel = this.getView().getModel("viewModel"),
                oRequestDetails = oViewModel.getProperty("/requestDetails"),
                oShareModel = this.getView().getModel("sharesModel"),
                oDividendModel = this.getView().getModel("dividendModel"),
                oSharesData = oShareModel.getProperty("/data"),
                oDividendData = oDividendModel.getProperty("/data");
            var oPayload = {
                UPLOAD_TYPE: oViewModel.getProperty("/selectedType"),
                STATUS: this.sActionFlag === "Interim" ? "01" : "02",
                EMP_ID: oRequestDetails.EmployeeId,
                EMP_NAME: oRequestDetails.EmployeeName,
                BUKRS: oRequestDetails.CompanyCode,
                EMP_GRADE_CODE: oRequestDetails.EmployeeGrade,
                EMP_SUB_GROUP: oRequestDetails.EmployeeSubgrp,
                EMP_SUB_AREA: oRequestDetails.PersonnelSubArea,
                EMP_SUB_AREA_TEXT: oRequestDetails.PersonnelSubAreaText,
                EMP_DEPT: oRequestDetails.Department,
                EMP_POSITION: oRequestDetails.PositionText,
                HeaderToShares: oViewModel.getProperty("/selectedType") === "S" ? oSharesData : [],
                HeaderToDividend: oViewModel.getProperty("/selectedType") === "D" ? oDividendData : []
            };
            if (oViewModel.getProperty("/TransactionId")) {
                oPayload.TRANS_ID = oViewModel.getProperty("/TransactionId");
            }
            return oPayload;
        },

        handleSubmitBtnPress: function (oEvent) {
            var oResourceBundle = this.getResourceBundle(),
                sTitle = oResourceBundle.getText("CONFIRM_TITLE"),
                sText = oResourceBundle.getText("CONFIRM_TEXT_FINAL_REQUEST"),
                bProceed = this.validateSubmitRequestDetails();
            var oModel = this.getView().getModel();
            if (bProceed) {
                messenger.confirm(sTitle, sText, "Confirm", null, function () {
                    BusyIndicator.show(0);
                    this.sActionFlag = "Submitted";
                    let oPayload = this.createRequestPayload();
                    oModel.create("/HeaderSet", oPayload, {
                        success: function (oResp) {
                            if (oResp.TRANS_ID) {
                                this.TRANS_ID = oResp.TRANS_ID;
                                BusyIndicator.hide();
                                messenger.success(oResourceBundle.getText("iepfRequestFinalSuccessMsg", oResp.TRANS_ID), () => {
                                    this.getOwnerComponent().getRouter().navTo("RouteDashboard", {}, {}, true);
                                });
                            }
                        }.bind(this),
                        error: function (oError) {
                            BusyIndicator.hide();
                            messenger.error(JSON.parse(oError.responseText).error.message.value);
                        }.bind(this)
                    });
                }.bind(this));
            }
        },

        validateSubmitRequestDetails: function () {
            var oViewModel = this.getView().getModel("viewModel"),
                oResourceBundle = this.getResourceBundle(),
                oRequestDetails = oViewModel.getProperty("/requestDetails"),
                sSelectedType = oViewModel.getProperty("/selectedType"),
                bProceed = true,
                sMessage = "";
            if (!sSelectedType) {
                bProceed = false;
                sMessage = oResourceBundle.getText("selectTypeErrorMsg");
            } else if (sSelectedType === "S" && this.getView().getModel("sharesModel").getProperty("/data").length === 0) {
                bProceed = false;
                sMessage = oResourceBundle.getText("pleaseUploadSharesDataMsg");
            } else if (sSelectedType === "D" && this.getView().getModel("dividendModel").getProperty("/data").length === 0) {
                bProceed = false;
                sMessage = oResourceBundle.getText("pleaseUploadDividendDataMsg");
            }
            if (!bProceed) {
                messenger.error(sMessage);
            }
            return bProceed;
        },

        setTransactionData: function (oRespData) {
            var oViewModel = this.getView().getModel("viewModel");
            let selectedType = oViewModel.getProperty("/selectedType");
            if (selectedType === "S") {
                this.getView().getModel("sharesModel").setProperty("/data", oRespData.HeaderToShares.results);
                const oTable = this.byId("idSharesTable");
                const oRowMode = oTable.getRowMode();
                const iCount = this.getView().getModel("sharesModel").getProperty("/data").length;
                if (iCount > 0) {
                    oRowMode.setRowCount(Math.min(iCount, 5));
                }
            } else if (selectedType === "D") {
                this.getView().getModel("dividendModel").setProperty("/data", oRespData.HeaderToDividend.results);
                const oTable = this.byId("idDividendTable");
                const oRowMode = oTable.getRowMode();
                const iCount = this.getView().getModel("dividendModel").getProperty("/data").length;
                if (iCount > 0) {
                    oRowMode.setRowCount(Math.min(iCount, 5));
                }
            }
        },

        onDownloadTemplate: function () {
            const sType = this.getView().getModel("viewModel").getProperty("/selectedType");
            var oResourceBundle = this.getResourceBundle();
            if (sType === "S") {
                const sUrl = sap.ui.require.toUrl(
                    "com/nhpc/zhriepfs1/templates/IEPF-SHARES-UploadTemplateExcel.xls"
                );
                const oLink = document.createElement("a");
                oLink.href = sUrl;
                oLink.download = oResourceBundle.getText("sharesTemplateFileName");
                document.body.appendChild(oLink);
                oLink.click();
                document.body.removeChild(oLink);
            } else if (sType === "D") {
                const sUrl = sap.ui.require.toUrl(
                    "com/nhpc/zhriepfs1/templates/IEPF-Dividend-UploadTemplateExcel.xlsx"
                );
                const oLink = document.createElement("a");
                oLink.href = sUrl;
                oLink.download = oResourceBundle.getText("dividendTemplateFileName");
                document.body.appendChild(oLink);
                oLink.click();
                document.body.removeChild(oLink);
            } else {
                messenger.error(oResourceBundle.getText("pleaseSelectTypeErrorMsg"));
            }
        },

        onFileTypeMissmatch: function (oEvent) {
            messenger.error(oResourceBundle.getText("invalidFileTypeMsg"));
            oEvent.getSource().setValue("");
        },

        onFileChange: function (oEvent) {
            var sID = oEvent.getParameter("id");
            this.sFileUploaderID = sID;
            var oFile = oEvent.getParameter("files") && oEvent.getParameter("files")[0];
            this.checkMalwareValidationUploadExcel(oFile);
        },

        checkMalwareValidationUploadExcel: function (oFileObject) {
            var oResourceBundle = this.getResourceBundle();
            if (oFileObject) {
                var reader = new FileReader();
                reader.onload = function (event) {
                    BusyIndicator.show(0);
                    var aArrayBuffer = event.currentTarget.result;
                    var sBinaryString = this.convertArratBufferToBinary(aArrayBuffer);
                    var sUrl = this.getBaseURL() + "/malware_api/scan";
                    this.aArrayBuffer = aArrayBuffer;
                    BusyIndicator.show(0);
                    jQuery.ajax({
                        url: sUrl,
                        type: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        data: sBinaryString,
                        success: function (oResp) {
                            if (oResp.malwareDetected) {
                                this.byId(this.sFileUploaderID).clear();
                                BusyIndicator.hide();
                                messenger.error(oResourceBundle.getText("malwareFileDetectedErrorMsg"));
                            } else {
                                BusyIndicator.hide();
                                this.extractExcelData(this.aArrayBuffer);
                            }
                        }.bind(this),
                        error: function (error) {
                            BusyIndicator.hide();
                            this.byId(this.sFileUploaderID).clear();
                            messenger.error(oResourceBundle.getText("malwareScanFailedErrorMsg"));
                        }.bind(this)
                    });
                }.bind(this);
                reader.readAsArrayBuffer(oFileObject);
            }
        },

        getBaseURL: function () {
            var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id"),
                appPath = appId.replaceAll(".", "/"),
                appModulePath = jQuery.sap.getModulePath(appPath);
            return appModulePath;
        },
        
        convertArratBufferToBinary: function (aArrayBufferObject) {
            var binary = '';
            const bytes = new Uint8Array(aArrayBufferObject);
            const len = bytes.byteLength;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return binary;
        },

        extractExcelData: function (oData) {
            BusyIndicator.show(0);
            var workbook = XLSX.read(oData, {
                type: "binary",
            });
            workbook.SheetNames.forEach(
                function (sheetName) {
                    var aExcelData = XLSX.utils.sheet_to_row_object_array(
                        workbook.Sheets[sheetName]
                    );
                    BusyIndicator.hide();
                    this.processUploadedData(aExcelData);
                }.bind(this)
            );
        },

    });
});