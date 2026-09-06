(function () {
    if (!window.GoezI18n) return;
    GoezI18n.register({
        'zh-Hant': {
            pageTitleStoreManage: 'Goez Shop - 管理已建立賣場',
            backHome: '‹ 返回會員首頁',
            pageTitle: '管理已建立賣場',
            pageSubtitle: '查看、編輯或刪除你所有的賣場。',
            emptyTitle: '尚未建立賣場唷！',
            emptyDesc: '請至首頁點選「設計我的賣場」開始你的第一間線上小店吧！',
            // 動態列表渲染
            statusPublished: '已發布',
            statusDraft: '草稿',
            createdAtPrefix: '建立於 {date}',
            btnView: '檢視',
            btnEdit: '編輯',
            btnDelete: '刪除',
            // 提示與確認彈窗
            confirmDeleteStore: '確定要刪除「{name}」嗎？此操作無法復原。',
            deleteSuccess: '賣場刪除成功！',
            deleteFail: '刪除失敗: ',
            unknownError: '未知錯誤',
            networkError: '網路異常，刪除失敗，請稍後再試'
        },
        en: {
            pageTitleStoreManage: 'Goez Shop - Manage Stores',
            backHome: '‹ Back to Member Home',
            pageTitle: 'Manage Stores',
            pageSubtitle: 'View, edit, or delete all of your online stores.',
            emptyTitle: 'No stores created yet!',
            emptyDesc: 'Go to Home and click "Design Store" to launch your first shop!',
            // Dynamic Render
            statusPublished: 'Published',
            statusDraft: 'Draft',
            createdAtPrefix: 'Created on {date}',
            btnView: 'View',
            btnEdit: 'Edit',
            btnDelete: 'Delete',
            // Alerts & Confirms
            confirmDeleteStore: 'Are you sure you want to delete "{name}"? This action cannot be undone.',
            deleteSuccess: 'Store deleted successfully!',
            deleteFail: 'Deletion failed: ',
            unknownError: 'Unknown error',
            networkError: 'Network error, failed to delete. Please try again later'
        },
        ja: {
            pageTitleStoreManage: 'Goez Shop - 作成済みショップ管理',
            backHome: '‹ マイページに戻る',
            pageTitle: '作成済みショップ管理',
            pageSubtitle: '作成したすべてのショップを確認・編集・削除できます。',
            emptyTitle: 'ショップがまだ作成されていません！',
            emptyDesc: 'ホームから「ショップをデザイン」をクリックして、最初のお店を開設しましょう！',
            // 動態リストレンダリング
            statusPublished: '公開中',
            statusDraft: '下書き',
            createdAtPrefix: '作成日：{date}',
            btnView: 'ショップ確認',
            btnEdit: '編集',
            btnDelete: '削除',
            // アラート＆確認ダイアログ
            confirmDeleteStore: '「{name}」を削除してもよろしいですか？この操作は取り消せません。',
            deleteSuccess: 'ショップを正常に削除しました！',
            deleteFail: '削除に失敗しました: ',
            unknownError: '不明なエラー',
            networkError: 'ネットワークエラーにより削除に失敗しました。後でもう一度お試しください'
        }
    });
})();