function AreFirstPhaseEventFieldsActive() {
    if (BannerInfo[CurrentBannerVal].Phase == 1) {
        if ($('#WishMode').val() == WishModes.Normal.value && $('#BannerEnd').val() == CurrentBannerVal) { // Only adding the skip logic for the advanced mode for now.
            return 1;
        }
        else if ($('#WishMode').val() == WishModes.Advanced.value) {
            for (let Banner of $('.WishPlanBannerEnd')) {

                if ($(Banner).val() == CurrentBannerVal && !$(Banner).hasClass('DisabledWishPlanRow')) {
                    return 1;
                };
            };
        };
    };

    return 0;
};

$(function() {$('#BannerEnd').change(function() {ToggleFirstPhaseEventFields()})});