function AreFirstPhaseEventFieldsActive() {
    if (BannerInfo[CurrentBannerVal].Phase == 1 && $('#WishMode').val() != WishModes.Simple.value) {
        for (let Banner of $('.WishPlanBannerEnd')) {

            if ($(Banner).val() == CurrentBannerVal && !$(Banner).hasClass('DisabledWishPlanRow')) {
                return 1;
            };
        };
    };

    return 0;
};