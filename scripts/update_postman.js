const fs = require('fs');
const file = 'c:/Users/Admin/Downloads/FreshBite_DaNang_API.postman_collection.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

// 1. Real active IDs from current MongoDB Database
const realBranchId = '6af0c51d3b65a7d2e50ecf6c';     // FreshBite FPT City (Ngũ Hành Sơn)
const realProductId = '6af0c51e3b65a7d2e50ecf76';    // Cà phê Muối Đà Nẵng
const realCustomerId = '6af00667c18066e2fdece862';   // user@freshbite.vn
const realOrderId = '6aef448a0c158723a07b252f';      // Real order
const realVoucherCode = 'FRESHBITE10';
const realVoucherId = '6af0c51e3b65a7d2e50ecf7f';

data.variable.forEach(v => {
  if (v.key === 'branchId') v.value = realBranchId;
  if (v.key === 'favoriteProductId') v.value = realProductId;
  if (v.key === 'productId') v.value = realProductId;
  if (v.key === 'customerId') v.value = realCustomerId;
  if (v.key === 'createdOrderId') v.value = realOrderId;
});

// Ensure voucher variables exist
if (!data.variable.find(v => v.key === 'voucherCode')) {
  data.variable.push({ key: 'voucherCode', value: realVoucherCode, type: 'string' });
}
if (!data.variable.find(v => v.key === 'voucherId')) {
  data.variable.push({ key: 'voucherId', value: realVoucherId, type: 'string' });
}
if (!data.variable.find(v => v.key === 'tempVoucherId')) {
  data.variable.push({ key: 'tempVoucherId', value: '', type: 'string' });
}

// 2. Helper to find item by name
function findItem(items, name) {
  for (const item of items) {
    if (item.name === name) return item;
    if (item.item) {
      const res = findItem(item.item, name);
      if (res) return res;
    }
  }
}

// Helper to find all items by name
function findAllItems(items, name, found = []) {
  for (const item of items) {
    if (item.name === name) found.push(item);
    if (item.item) findAllItems(item.item, name, found);
  }
  return found;
}

// 3. Update '09. Get All Products & Auto-Save IDs'
const prodsReqs = findAllItems(data.item, '09. Get All Products & Auto-Save IDs (GET /api/products)');
prodsReqs.forEach(req => {
  req.event = req.event || [];
  let testEvent = req.event.find(e => e.listen === 'test');
  if (testEvent) {
    testEvent.script.exec = [
      'pm.test("Status code is 200 OK", function () {',
      '    pm.response.to.have.status(200);',
      '});',
      'pm.test("Auto-save favoriteProductId variable", function () {',
      '    var jsonData = pm.response.json();',
      '    pm.expect(jsonData.success).to.be.true;',
      '    pm.expect(jsonData.data.length).to.be.above(0);',
      '    pm.collectionVariables.set("favoriteProductId", jsonData.data[0]._id);',
      '    pm.collectionVariables.set("productId", jsonData.data[0]._id);',
      '    console.log("Saved favoriteProductId and productId: " + jsonData.data[0]._id);',
      '});'
    ];
  }
});

// 4. Update '14. Create Pick-up Order (POST /api/orders)'
const orderReqs = findAllItems(data.item, '14. Create Pick-up Order (POST /api/orders)');
orderReqs.forEach(req => {
  req.event = req.event || [];
  let prEvent = req.event.find(e => e.listen === 'prerequest');
  const preScript = [
    'if (!pm.collectionVariables.get("branchId") || pm.collectionVariables.get("branchId") === "6aefe224c9f0c144ae2ef72a") {',
    '    pm.sendRequest(pm.collectionVariables.get("baseUrl") + "/api/branches", function (err, res) {',
    '        if (!err && res.code === 200) {',
    '            var branches = res.json().data;',
    '            if (branches && branches.length > 0) {',
    '                pm.collectionVariables.set("branchId", branches[0]._id);',
    '                console.log("Auto-saved active branchId: " + branches[0]._id);',
    '            }',
    '        }',
    '    });',
    '}'
  ];
  if (prEvent) {
    prEvent.script.exec = preScript;
  } else {
    req.event.push({
      listen: 'prerequest',
      script: {
        type: 'text/javascript',
        exec: preScript
      }
    });
  }
});

// 5. Update '7.2. Download Order Invoice via res.download'
const invoiceReq = findItem(data.item, '7.2. Download Order Invoice via res.download (GET /api/orders/:id/invoice)');
if (invoiceReq) {
  invoiceReq.event = invoiceReq.event || [];
  let prEvent = invoiceReq.event.find(e => e.listen === 'prerequest');
  const invoicePreScript = [
    'if (!pm.collectionVariables.get("createdOrderId")) {',
    '    pm.sendRequest({',
    '        url: pm.collectionVariables.get("baseUrl") + "/api/orders/my-orders",',
    '        method: "GET",',
    '        header: { "Authorization": "Bearer " + pm.collectionVariables.get("token") }',
    '    }, function (err, res) {',
    '        if (!err && res.code === 200) {',
    '            var orders = res.json().data;',
    '            if (orders && orders.length > 0) {',
    '                pm.collectionVariables.set("createdOrderId", orders[0]._id);',
    '                console.log("Auto-saved fallback createdOrderId: " + orders[0]._id);',
    '            }',
    '        }',
    '    });',
    '}'
  ];
  if (prEvent) {
    prEvent.script.exec = invoicePreScript;
  } else {
    invoiceReq.event.push({
      listen: 'prerequest',
      script: {
        type: 'text/javascript',
        exec: invoicePreScript
      }
    });
  }

  let testEvent = invoiceReq.event.find(e => e.listen === 'test');
  if (testEvent) {
    testEvent.script.exec = [
      'pm.test("Status code is 200 OK", function () {',
      '    pm.response.to.have.status(200);',
      '});',
      'pm.test("Content-Disposition header triggers download", function () {',
      '    var cd = pm.response.headers.get("Content-Disposition");',
      '    pm.expect(cd).to.be.a("string");',
      '    pm.expect(cd).to.include("attachment");',
      '});'
    ];
  }
}

// 6. Add 7.12 to Folder 7 if not present
const folder7 = data.item.find(i => i.name.startsWith('7. Uploads'));
if (folder7 && !folder7.item.find(i => i.name.includes('7.12'))) {
  folder7.item.push({
    name: '7.12. Download Product CSV Import Template (GET /api/uploads/template/product-import)',
    request: {
      method: 'GET',
      header: [],
      url: {
        raw: '{{baseUrl}}/api/uploads/template/product-import',
        host: ['{{baseUrl}}'],
        path: ['api', 'uploads', 'template', 'product-import']
      },
      description: 'Slot 12 - Tải file mẫu CSV thực đơn bằng res.download() kèm UTF-8 BOM'
    },
    response: [],
    event: [
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: [
            'pm.test("Status code is 200 OK", function () {',
            '    pm.response.to.have.status(200);',
            '});',
            'pm.test("Header Content-Disposition triggers file download", function () {',
            '    var cd = pm.response.headers.get("Content-Disposition");',
            '    pm.expect(cd).to.be.a("string");',
            '    pm.expect(cd).to.include("attachment");',
            '    pm.expect(cd).to.include("FreshBite_Menu_Import_Template.csv");',
            '});'
          ]
        }
      }
    ]
  });
}

// 7. Add Folder 11: Vouchers & Promotion Marketing (Nguyen Dac Thinh)
if (!data.item.find(i => i.name.startsWith('11. Vouchers'))) {
  const folder11 = {
    name: '11. Vouchers & Promotion Marketing (Nguyen Dac Thinh)',
    item: [
      {
        name: '11.1. Get Active Vouchers (GET /api/vouchers/active)',
        request: {
          method: 'GET',
          header: [],
          url: {
            raw: '{{baseUrl}}/api/vouchers/active',
            host: ['{{baseUrl}}'],
            path: ['api', 'vouchers', 'active']
          },
          description: 'Lấy danh sách mã giảm giá đang còn hiệu lực'
        },
        response: [],
        event: [
          {
            listen: 'test',
            script: {
              type: 'text/javascript',
              exec: [
                'pm.test("Status code is 200 OK", function () {',
                '    pm.response.to.have.status(200);',
                '});',
                'var jsonData = pm.response.json();',
                'pm.test("Returns active vouchers list", function () {',
                '    pm.expect(jsonData.success).to.be.true;',
                '    pm.expect(jsonData.data).to.be.an("array");',
                '});',
                'if (jsonData.data && jsonData.data.length > 0) {',
                '    pm.collectionVariables.set("voucherCode", jsonData.data[0].code);',
                '    pm.collectionVariables.set("voucherId", jsonData.data[0]._id);',
                '}'
              ]
            }
          }
        ]
      },
      {
        name: '11.2. Apply Voucher to Cart (POST /api/vouchers/apply)',
        request: {
          method: 'POST',
          header: [
            { key: 'Content-Type', value: 'application/json' },
            { key: 'Authorization', value: 'Bearer {{token}}' }
          ],
          body: {
            mode: 'raw',
            raw: '{\n  "voucherCode": "{{voucherCode}}",\n  "subtotal": 100000\n}'
          },
          url: {
            raw: '{{baseUrl}}/api/vouchers/apply',
            host: ['{{baseUrl}}'],
            path: ['api', 'vouchers', 'apply']
          },
          description: 'Kiểm tra 4 điều kiện và tính toán tiền giảm giá voucher'
        },
        response: [],
        event: [
          {
            listen: 'test',
            script: {
              type: 'text/javascript',
              exec: [
                'pm.test("Status code is 200 OK", function () {',
                '    pm.response.to.have.status(200);',
                '});',
                'var jsonData = pm.response.json();',
                'pm.test("Voucher applied and calculated discount", function () {',
                '    pm.expect(jsonData.success).to.be.true;',
                '    pm.expect(jsonData.data.discount).to.be.above(0);',
                '    pm.expect(jsonData.data.finalAmount).to.be.below(100000);',
                '});'
              ]
            }
          }
        ]
      },
      {
        name: '11.3. Admin Get All Vouchers (GET /api/vouchers)',
        request: {
          method: 'GET',
          header: [
            { key: 'Authorization', value: 'Bearer {{adminToken}}' }
          ],
          url: {
            raw: '{{baseUrl}}/api/vouchers',
            host: ['{{baseUrl}}'],
            path: ['api', 'vouchers']
          },
          description: '[Admin] Lấy toàn bộ danh sách voucher hệ thống'
        },
        response: [],
        event: [
          {
            listen: 'test',
            script: {
              type: 'text/javascript',
              exec: [
                'pm.test("Status code is 200 OK", function () {',
                '    pm.response.to.have.status(200);',
                '});',
                'var jsonData = pm.response.json();',
                'pm.test("Admin sees all vouchers", function () {',
                '    pm.expect(jsonData.success).to.be.true;',
                '    pm.expect(jsonData.data).to.be.an("array");',
                '});'
              ]
            }
          }
        ]
      },
      {
        name: '11.4. Admin Create Voucher (POST /api/vouchers)',
        request: {
          method: 'POST',
          header: [
            { key: 'Content-Type', value: 'application/json' },
            { key: 'Authorization', value: 'Bearer {{adminToken}}' }
          ],
          body: {
            mode: 'raw',
            raw: '{\n  "code": "POSTMAN{{$timestamp}}",\n  "title": "Mã ưu đãi Postman Test Suite",\n  "discountType": "PERCENT",\n  "discountValue": 20,\n  "maxDiscount": 40000,\n  "minOrderAmount": 50000,\n  "startDate": "2026-01-01",\n  "endDate": "2027-12-31",\n  "isActive": true\n}'
          },
          url: {
            raw: '{{baseUrl}}/api/vouchers',
            host: ['{{baseUrl}}'],
            path: ['api', 'vouchers']
          },
          description: '[Admin] Tạo mới mã voucher khuyến mãi'
        },
        response: [],
        event: [
          {
            listen: 'test',
            script: {
              type: 'text/javascript',
              exec: [
                'pm.test("Status code is 201 Created", function () {',
                '    pm.response.to.have.status(201);',
                '});',
                'var jsonData = pm.response.json();',
                'pm.test("Voucher created successfully", function () {',
                '    pm.expect(jsonData.success).to.be.true;',
                '    pm.expect(jsonData.data._id).to.exist;',
                '    pm.collectionVariables.set("tempVoucherId", jsonData.data._id);',
                '});'
              ]
            }
          }
        ]
      },
      {
        name: '11.5. Get Voucher Detail by ID (GET /api/vouchers/:id)',
        request: {
          method: 'GET',
          header: [],
          url: {
            raw: '{{baseUrl}}/api/vouchers/{{tempVoucherId}}',
            host: ['{{baseUrl}}'],
            path: ['api', 'vouchers', '{{tempVoucherId}}']
          },
          description: 'Xem chi tiết 1 voucher theo ID'
        },
        response: [],
        event: [
          {
            listen: 'test',
            script: {
              type: 'text/javascript',
              exec: [
                'pm.test("Status code is 200 OK", function () {',
                '    pm.response.to.have.status(200);',
                '});',
                'var jsonData = pm.response.json();',
                'pm.test("Returns correct voucher detail", function () {',
                '    pm.expect(jsonData.success).to.be.true;',
                '    pm.expect(jsonData.data._id).to.eql(pm.collectionVariables.get("tempVoucherId"));',
                '});'
              ]
            }
          }
        ]
      },
      {
        name: '11.6. Admin Update Voucher (PUT /api/vouchers/:id)',
        request: {
          method: 'PUT',
          header: [
            { key: 'Content-Type', value: 'application/json' },
            { key: 'Authorization', value: 'Bearer {{adminToken}}' }
          ],
          body: {
            mode: 'raw',
            raw: '{\n  "title": "Mã ưu đãi Postman (Đã cập nhật)",\n  "maxDiscount": 50000\n}'
          },
          url: {
            raw: '{{baseUrl}}/api/vouchers/{{tempVoucherId}}',
            host: ['{{baseUrl}}'],
            path: ['api', 'vouchers', '{{tempVoucherId}}']
          },
          description: '[Admin] Cập nhật voucher'
        },
        response: [],
        event: [
          {
            listen: 'test',
            script: {
              type: 'text/javascript',
              exec: [
                'pm.test("Status code is 200 OK", function () {',
                '    pm.response.to.have.status(200);',
                '});',
                'var jsonData = pm.response.json();',
                'pm.test("Voucher updated successfully", function () {',
                '    pm.expect(jsonData.success).to.be.true;',
                '    pm.expect(jsonData.data.title).to.include("Đã cập nhật");',
                '});'
              ]
            }
          }
        ]
      },
      {
        name: '11.7. Admin Delete Voucher (DELETE /api/vouchers/:id)',
        request: {
          method: 'DELETE',
          header: [
            { key: 'Authorization', value: 'Bearer {{adminToken}}' }
          ],
          url: {
            raw: '{{baseUrl}}/api/vouchers/{{tempVoucherId}}',
            host: ['{{baseUrl}}'],
            path: ['api', 'vouchers', '{{tempVoucherId}}']
          },
          description: '[Admin] Xóa voucher'
        },
        response: [],
        event: [
          {
            listen: 'test',
            script: {
              type: 'text/javascript',
              exec: [
                'pm.test("Status code is 200 OK", function () {',
                '    pm.response.to.have.status(200);',
                '});',
                'var jsonData = pm.response.json();',
                'pm.test("Voucher deleted successfully", function () {',
                '    pm.expect(jsonData.success).to.be.true;',
                '});'
              ]
            }
          }
        ]
      },
      {
        name: '11.8. [Negative Test] Apply Invalid Voucher (POST /api/vouchers/apply)',
        request: {
          method: 'POST',
          header: [
            { key: 'Content-Type', value: 'application/json' }
          ],
          body: {
            mode: 'raw',
            raw: '{\n  "voucherCode": "INVALID_NONEXISTENT_CODE_XYZ",\n  "subtotal": 100000\n}'
          },
          url: {
            raw: '{{baseUrl}}/api/vouchers/apply',
            host: ['{{baseUrl}}'],
            path: ['api', 'vouchers', 'apply']
          },
          description: '[Negative Test] Bắt lỗi khi áp dụng mã voucher không tồn tại'
        },
        response: [],
        event: [
          {
            listen: 'test',
            script: {
              type: 'text/javascript',
              exec: [
                'pm.test("Status code is 404 Not Found", function () {',
                '    pm.response.to.have.status(404);',
                '});',
                'var jsonData = pm.response.json();',
                'pm.test("Returns success false for invalid voucher", function () {',
                '    pm.expect(jsonData.success).to.be.false;',
                '});'
              ]
            }
          }
        ]
      }
    ]
  };
  data.item.push(folder11);
}

fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
console.log('Postman collection updated successfully with full project data!');
