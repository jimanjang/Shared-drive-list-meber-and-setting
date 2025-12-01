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


