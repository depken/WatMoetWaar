sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/Filter",
	"sap/m/MessageBox"
], function (Controller, Filter, MessageBox) {
	"use strict";

	return Controller.extend("com.jonasdp.WatMoetWaar.controller.Master", {
		onAfterRendering: function () {
			this.getView().setBusy(true);
			var me = this;
			$.ajax({
				type: 'GET',
				url: "/ilva/api/afvalalfabet/query-afvalalfabet.php",
				async: true
			}).done(function (results) {
				results = JSON.parse(results);

				//remove empty entries
				results = results.filter(item => item.label !== null);

				me.getOwnerComponent().getModel("Items").setData(results);
				me.getView().setBusy(false);
			}).fail(function (err) {
				console.log(err);
				me.getView().setBusy(false);
			});
		},

		onSearch: function (oEvent) {
			// add filter for search
			var aFilters = [];
			var sQuery = oEvent.getSource().getValue();
			if (sQuery && sQuery.length > 0) {
				var filter = new Filter("label", sap.ui.model.FilterOperator.Contains, sQuery);
				aFilters.push(filter);
			}

			// update list binding
			var list = this.byId("idList");
			var binding = list.getBinding("items");
			binding.filter(aFilters, "Application");
		},

		onSelectionChange: function (oEvent) {
			var me = this;
			let oSelObj = oEvent.getSource().getSelectedItem().getBindingContext("Items").getObject();
			$.ajax({
				type: "POST",
				url: "/ilva/afvalalfabet",
				data: {
					product: oSelObj.label,
					productid: oSelObj.id
				}
			}).done(function (results) {
				me._processResultHTML(results, oSelObj.label);
			}).fail(function (err) {
				console.log(err);
				me.getView().setBusy(false);
			});
		},

		_processResultHTML: function (sHTML, sLabel) {
			//parse htmlstring into html
			let html = document.createElement("html");
			html.innerHTML = sHTML;

			//get all h4 elements
			let aH4Elements = html.getElementsByTagName("h4");
			let oResultElement = [...aH4Elements].find(elt => elt.innerHTML === sLabel);

			let oParentElt = oResultElement.parentElement;
			let oTable = oParentElt.children[1];
			let oTableBody = oTable.children[1];
			let sTableRow = oTableBody.innerHTML;

			let htmlTableRow = document.createElement("tr");
			htmlTableRow.innerHTML = sTableRow;

			let sOphaling = htmlTableRow.children[0].innerText;
			let sContainerpark = htmlTableRow.children[1].innerText;
			let sOther = htmlTableRow.children[2].innerText;

			this.getOwnerComponent().getModel("SorteerDetails").setData({
				ophaling: sOphaling,
				containerpark: sContainerpark,
				andere: sOther
			});
			
			this._openResultDialog();
		},
		
		_openResultDialog: function(){
			let oSorteerDetails = this.getOwnerComponent().getModel("SorteerDetails");
			let sMsg = "Ophaling: " + oSorteerDetails.getProperty("/ophaling")
				+ "\n" + "Containerpark: " + oSorteerDetails.getProperty("/containerpark")
				+ "\n" + "Andere: " + oSorteerDetails.getProperty("/andere");
			
			MessageBox.information(sMsg);
		}
	});
});