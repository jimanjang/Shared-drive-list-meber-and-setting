/*
 * Copyright (c) 2023 netkiller.com. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/*
 * 저작권 (c) 2023 netkiller.com. 모든 권리 보유.
 *
 * 본 소프트웨어와 관련 문서 파일(이하 "소프트웨어")의 복사본을 보유하게 된 모든 사람에게 
 * 무료로 이 소프트웨어를 사용하고, 복사하고, 수정하고, 병합하고, 발행하고, 배포하고, 재사용할 수 있는 
 * 권한을 부여하며, 본 소프트웨어를 제공받은 자에게도 동일한 권한을 부여하되, 다음의 조건을 따르도록 합니다:
 *
 * 위의 저작권 고지와 이 허가 고지는 본 소프트웨어의 모든 복사본이나 주요 부분에 포함되어야 합니다.
 *
 * 본 소프트웨어는 "있는 그대로" 제공되며, 어떠한 형태의 보증도 하지 않습니다. 
 * 상품성, 특정 목적에의 적합성, 또는 비침해에 대한 보증을 포함하여(이에 한정되지 않음) 명시적이든 묵시적이든 
 * 어떠한 형태의 보증도 하지 않습니다. 어떠한 경우에도 저작자나 저작권 소유자는 
 * 계약 행위, 불법 행위 또는 그 외의 행위로 인하여 발생하는, 
 * 소프트웨어의 사용 또는 기타 관련 행위와 연관된 어떠한 요구사항, 손해 또는 기타 책임에 대해 책임지지 않습니다.
 */

function listSharedDrives() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();

  // 헤더 설정
  sheet.getRange(1, 1).setValue('Drive Name');
  sheet.getRange(1, 2).setValue('Member');
  sheet.getRange(1, 3).setValue('Permission');

  Logger.log("Getting Shared Drives");
  var pageToken = null;
  var row = 2;
  
  do {
    var page = Drive.Drives.list({
      pageToken: pageToken,
      maxResults: 10, // 한 번에 가져올 최대 드라이브 수 설정
      orderBy: 'name',
      useDomainAdminAccess: true,
      fields: 'nextPageToken, items(id, name)',
    });

    var drives = page.items;

    if (drives) {
      for (var i = 0; i < drives.length; i++) {
        var drive = drives[i];
        var name = drive.name;
        var driveID = drive.id;

        // 멤버 및 권한 가져오기
        var permissions = Drive.Permissions.list(driveID, {
          useDomainAdminAccess: true,
          supportsAllDrives: true,
          fields: 'items(emailAddress, role)'
        }).items;

        if (permissions) {
          for (var j = 0; j < permissions.length; j++) {
            var permission = permissions[j];
            var member = permission.emailAddress;
            var role = permission.role;

            // 스프레드시트에 정보 작성
            sheet.getRange(row, 1).setValue(name);
            sheet.getRange(row, 2).setValue(member);
            sheet.getRange(row, 3).setValue(role);
            row++;
          }
        } else {
          // 멤버가 없는 경우, 드라이브 이름만 작성
          sheet.getRange(row, 1).setValue(name);
          sheet.getRange(row, 2).setValue('No members');
          sheet.getRange(row, 3).setValue('No permissions');
          row++;
        }
      }
    }
    
    pageToken = page.nextPageToken;
  } while (pageToken);
}

function createSharedDriveWithNewDomain() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  
  var newDomain = "newdomain.com";  // 변경할 새로운 도메인명
  var row = 2;  // 공유드라이브 정보가 입력된 시트의 첫 번째 데이터 행
  
  // 스프레드시트에서 드라이브 정보와 멤버 정보를 읽어옴
  while (sheet.getRange(row, 1).getValue() !== "") {
    var driveName = sheet.getRange(row, 1).getValue();  // 드라이브 이름
    var memberEmail = sheet.getRange(row, 2).getValue();  // 멤버 이메일
    var permissionRole = sheet.getRange(row, 3).getValue();  // 멤버 권한

    // 멤버의 도메인명 변경
    var emailParts = memberEmail.split("@");
    var newEmail = emailParts[0] + "@" + newDomain;

    // 새로운 공유드라이브 생성
    var newDrive = Drive.Drives.insert({
      name: driveName + " - copy",  // 새로운 드라이브 이름은 기존 이름에 'copy'를 추가
    });
    var newDriveId = newDrive.id;

    // 새로운 도메인으로 멤버 추가
    var newPermission = {
      role: permissionRole,  // 기존 권한 유지
      type: 'user',
      emailAddress: newEmail
    };
    
    // 새로운 공유드라이브에 멤버 권한 추가
    Drive.Permissions.insert(newPermission, newDriveId, {
      useDomainAdminAccess: true,
      supportsAllDrives: true
    });

    row++;  // 다음 행으로 이동
  }

  Logger.log("New shared drives created with updated domain names.");
}


function onOpen(e) {
  // 스프레드시트가 열릴 때마다 메뉴를 생성하고, 'List all shared drives' 항목 추가
  SpreadsheetApp.getUi().createAddonMenu()
        .addItem('List all shared drives', 'listSharedDrives')
        .addItem('update member', 'update member')
        .addToUi();
}


