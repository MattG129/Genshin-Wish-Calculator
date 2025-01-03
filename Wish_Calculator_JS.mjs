// NA region's start date for version 4 in est. Since (almost) all patches are exactly six weeks, we can use this date to calculate the start and end dates for other patches.
const v4StartDate = moment('2023-8-15', "YYYY-MM-DD").toDate();
let BannerInfo = [];
let LastBannerInfo;
let Trials = 10**6;

let Today = new Date();
Today.setHours(0,0,0,0);

const BannerTypeDropdownOptions = {
    CHARACTER:       {value: 1, text: 'Character'},
    WEAPON:          {value: 2, text: 'Weapon'},
    CHRONICLED_WISH: {value: 3, text: 'Chronicled Wish'}
}

function DateAdd(date, days) {
    const newDate = new Date(date);
    
    newDate.setDate(date.getDate() + days);
    
    return newDate;
}

function DateDiff(DateFrom, DateTo) {
    return Math.floor((DateTo - DateFrom)/(1000 * 60 * 60 * 24));
}

function GetBannerInfo() {
    let Patch = 40; // Using integers so we don't have to deal with floats.

    let PatchDiff = 0; // This will track how many patches are between the current patch and any subsequent patches.
    let BannerEndDate = DateAdd(v4StartDate, 21);

    let TotalPhaseDiff = 0;
    let PhaseDiffFromCurrentBanner = -1; //Since we only care about this value for active banners so we can have it start at -1.

    let First = true
    while (PatchDiff <= 25) {
        if (!First) { // Since we are starting with 4.0 phase 1, we don't want to increae the patch/phase on the first iteration.
            BannerEndDate = DateAdd(BannerEndDate, 21);
            TotalPhaseDiff++;
            
            // Increase the patch everytime we reach a phase 1 banner. If the patch is a ".8" then the next patch should be a ".0".
            if (TotalPhaseDiff % 2 == 0) {
                if ((Patch % 10) == 8) {
                    Patch += 2;
                }
                else {
                  Patch++;
                }
            }
        }
        else {
            First = false
        }

        if (BannerEndDate > Today) {
            // Increase the patch diff everytime we reach a phase 1 banner, unless its the current banner.
            if ((TotalPhaseDiff % 2 == 0) && DateDiff(Today, BannerEndDate) > 21) {
                PatchDiff += 1;  
            }

            $('#BannerEnd').append($('<option>', {
                value: TotalPhaseDiff,
                text: `${(Patch/10).toFixed(1)} Phase ${(TotalPhaseDiff % 2) + 1} (Ends on ${moment(BannerEndDate, "YYYY-MM-DD").format('L')})`,
            }));

            PhaseDiffFromCurrentBanner++
        }

        BannerInfo.push({
            'MonthDiff': 12 * (BannerEndDate.getFullYear() - Today.getFullYear()) + (BannerEndDate.getMonth() - Today.getMonth()),
            'PatchDiff': PatchDiff,
            'Phase': (TotalPhaseDiff % 2) + 1,
            'BannerEndDate': BannerEndDate,
            'PatchStartDate': DateAdd(BannerEndDate, -21*((TotalPhaseDiff % 2) + 1)),
            'Patch': (Patch/10).toFixed(1),
            'PhaseDiff': PhaseDiffFromCurrentBanner
        });

    }
}

function SavingsCalculator(WishConfig) {
    let CurrentBannerVal = $('#BannerEnd')[0].options[0].value;

    // TODO: Could maybe go a bit more in depth.
    let Primos = WishConfig.Primos;

    if(WishConfig.WishMode != WishModes.SIMPLE.value) {
        // 40 primos from character trials, every banner. Assumes that this banner's trial primos have already been claimed.
        Primos += 40*(LastBannerInfo.PhaseDiff);
        
        Primos += DateDiff(Today, LastBannerInfo.BannerEndDate) * ( 60 + (WishConfig.HasWelkin ? 90 : 0) ); // 60 primos for dailies plus 90 for welkin, if purchased.

        let ExpectedAbyssPrimos = 0

        const FloorVals = [WishConfig.ExpectedStarsFloor9, WishConfig.ExpectedStarsFloor10, WishConfig.ExpectedStarsFloor11, WishConfig.ExpectedStarsFloor12]
        
        for (let i = 0; i <= FloorVals.length; i++) {
            if (FloorVals[i] == 3) { // 9 Stars
                ExpectedAbyssPrimos += 200;
            }
            else if (FloorVals[i] >= 2) { // 6-8 Stars
                ExpectedAbyssPrimos += 100;
            }
            else if (FloorVals[i] >= 1) { // 3-5 Stars
                ExpectedAbyssPrimos += 50;
            }
        }

        // TODO: Might want to add a comment here explaining the whole process.
        let AbyssCycles = LastBannerInfo.MonthDiff - WishConfig.AbyssCurrentCycleCompleted;
        
        // Since the abyss resets on the 16th of each month, the calculations needed to get the number of abyss cycles, are slightly different.
        if (LastBannerInfo.BannerEndDate.getDate() >= 16) {
            AbyssCycles += 1;
        }
        if (Today.getDate() < 16) {
            AbyssCycles += 1;
        }

        Primos += ExpectedAbyssPrimos * AbyssCycles;

        let ExpectedTheaterPrimos = 0;
        switch (WishConfig.ExpectedAct) {
            case 0:  ExpectedTheaterPrimos = 0;   break;
            case 1:  ExpectedTheaterPrimos = 60;  break;
            case 2:  ExpectedTheaterPrimos = 120; break;
            case 3:  ExpectedTheaterPrimos = 220; break;
            case 4:  ExpectedTheaterPrimos = 280; break;
            case 5:  ExpectedTheaterPrimos = 340; break;
            case 6:  ExpectedTheaterPrimos = 440; break;
            case 7:  ExpectedTheaterPrimos = 500; break;
            case 8:  ExpectedTheaterPrimos = 620; break;
            case 9:  ExpectedTheaterPrimos = 680; break;
            case 10: ExpectedTheaterPrimos = 800; break;
        }

        // Expected Primos times the number of months left to save plus the current month, if the challenge hasn't already been completed this month.
        Primos += ExpectedTheaterPrimos * (LastBannerInfo.MonthDiff + (1 - WishConfig.ITCurrentCycleCompleted));
        
        // Live Stream Primos
        // If there are any patches after the current patch, then we will add 300 primos for each of them, unless the final banner ends in the first phase. In which case we will add 300 for all but the final patch as we would finish wishing before the it's live stream airs.
        // TODO: Could maybe go a bit more in depth.
        if (LastBannerInfo.PatchDiff > 0) {
            if (LastBannerInfo.Phase == 1) {
                Primos += 300 * (LastBannerInfo.PatchDiff - 1);

            }
            else {
                Primos += 300 * LastBannerInfo.PatchDiff;
            }
        }

        // Adding in the current patches primos for the live steam, if applicable. Live streams generally air on the second to last Friday of a patch, or 31 days into the patch. 
        // If we are 31 or more days into the patch, then the user should have already been able to claim the primos, thus we no longer need to account for them. 
        // If the current patch is also the final patch, for wishing, then wishing will have to go into the second phase in order to claim the primos.
        if ( (LastBannerInfo.PatchDiff > 0 || LastBannerInfo.Phase === 2) && (DateDiff(BannerInfo[CurrentBannerVal].PatchStartDate, Today) < 31) ) {
            Primos += 300;
        }

        // Maintenance
        // TODO: Could maybe go a bit more in depth.
        Primos += 300 * LastBannerInfo.PatchDiff;

        if (WishConfig.EnableEventCalcs) {

            Primos += (900 + 3*420) * (LastBannerInfo.PatchDiff + 1); // +1 for current patch.

            // Subtracts claimed event primos.
            Primos -= WishConfig.FlagshipEventCompleted ? 900 : 0;
            Primos -= 420*WishConfig.SecondaryEventsCompleted

            // Subtracts unclaimable event primos.
            if (LastBannerInfo.Phase != 2) { // All events will be completable if the banner ends in the second half.
                // User's should only know the events schedule as far out as the end of the next banner. 
                // For phase 1 banners farther out than that we will assume that only one secondary event can be completed and the flagship event cannot be completed.
                if (LastBannerInfo.PhaseDiff > 1) {
                    Primos -= 900;
                    Primos -= 2*420;
                }
                else {
                    Primos -= WishConfig.FlagshipEventCompletable ? 0 : 900;
                    Primos -= 420*(3-WishConfig.SecondaryEventsCompletable);
                };
            };
        
            if (WishConfig.UsingHoyoLabCheckin) {
                Primos += 60*(LastBannerInfo.MonthDiff + 1); // +1 for the current month.
                
                // Subtract based on the amount of primos we could claim.
                if      (Today.getDate() >= 18) {Primos -= 60}
                else if (Today.getDate() >= 11) {Primos -= 40}
                else if (Today.getDate() >=  4) {Primos -= 20};

                // Subtracts primos based on how many could actually be claimed by the banner end date.
                if      (LastBannerInfo.BannerEndDate.getDate() <  4) {Primos -= 60}
                else if (LastBannerInfo.BannerEndDate.getDate() < 11) {Primos -= 40}
                else if (LastBannerInfo.BannerEndDate.getDate() < 18) {Primos -= 20};
            };
        };
    }

    // TODO: Could maybe go a bit more in depth.
    let IntertwinedFates = WishConfig.IntertwinedFates;

    // TODO: Could maybe go a bit more in depth.
    let Starglitter;
    if (WishConfig.UsingStarglitter) {
        IntertwinedFates += Math.floor(WishConfig.Starglitter / 5);
        Starglitter = WishConfig.Starglitter % 5;
    }
    
    if (WishConfig.WishMode != WishModes.SIMPLE.value) {

        // Up to five Intertwined Fates can be purchased every month from the Stardust Exchange.
        // Assumes that the current month's supply has already been purchased.
        // If the Stardust field is left empty then it will be assumed that all available Intertwined Fates can be purchased.
        if (WishConfig.Stardust === '') {
            IntertwinedFates += 5 * LastBannerInfo.MonthDiff;
        }
        else {
            IntertwinedFates += Math.min(5 * LastBannerInfo.MonthDiff, Math.floor(WishConfig.Stardust / 75));
        }

        // TODO: Could maybe go a bit more in depth.
        if (WishConfig.BPPurchased) {
            IntertwinedFates += Math.max(0, (LastBannerInfo.Phase === 1 ? 3 : 4) + 4 * LastBannerInfo.PatchDiff - Math.min(4, WishConfig.BPLevel)); 
            // Assumes that the user will only be able to claim 3 of the 4 fates for that pass, if the banner ends in the first phase. 
            // Also, subtracts the amount of fates already claimed from this battle pass.
            // Subtracting the claimed interwined fates has to be done on the same line so it can be wrapped in the max function as there is an edge case where
            //      the user can earn 4 intertwined from the pass while the system is only expecting 3 to be claimable and so it would result in -1 fates being expected from the pass.

            Primos += 680 * ((LastBannerInfo.Phase === 2 ? 1 : 0) + LastBannerInfo.PatchDiff); // Assumes that the user won't reach level 50 for that pass, if the banner ends in the first phase.
            if (WishConfig.BPLevel === 5) { // Subtracts 680, if the primos have already been claimed for this pass.
                Primos -= 680;
            }
        }

        // There are three bp missions to "Enhance 5-star artifacts a total of 30/60/100 levels".
        // The rewards add up to 60 primos, are not time gated, and don't require purchasing the pass.
        Primos += 60*LastBannerInfo.PatchDiff; 
    }


    // TODO: Could maybe go a bit more in depth.
    let WishesMade = Math.floor(Primos/160) + IntertwinedFates;

    // TODO: Could maybe go a bit more in depth.
    if (WishConfig.UsingStarglitter) {
        let FourStars = Math.floor(WishesMade / 10);
        let FourStarPity = WishesMade % 10;
        // TODO: Add a comment regarding why this doesn't differentiate for on banner and off banner four stars.
        Starglitter += Math.max(0, 2 * (FourStars - (WishConfig.MissingFourStars + LastBannerInfo.PatchDiff)));
        // Won't get starglitter for newly acquired four stars. Adds up the number of currently missing four stars plus those that may be added in future patches. 
        // Assumes that one will be added per patch to err on the side of caution, although this often won't be the case.

        let AdditionalWishesMade;
        let AdditionalFourStars;
        while (Starglitter >= 5) {
            AdditionalWishesMade = Math.floor(Starglitter / 5);
            Starglitter %= 5;
            AdditionalFourStars = Math.floor((AdditionalWishesMade + FourStarPity) / 10);
            FourStarPity = (AdditionalWishesMade + FourStarPity) % 10;
            Starglitter += 2 * AdditionalFourStars;

            WishesMade += AdditionalWishesMade;
        }
    }

    return WishesMade
}

let Wishes;
let Lost5050s;
let NonGuaranteeCharacterWinChance;
let CapturingRadiancePity;

let CharacterPity;
let CharacterGuarantee;
let CharacterRate;

let WeaponPity;
let WeaponGuarantee;
let WeaponFatePoints;
let WeaponRate;

let ChronicledPity;
let ChronicledFatePoints;
let ChronicledRate;

function NumericWishCalculations(WishConfig) {
    // TODO: Add comments.
    Wishes = 0;
    let Successes = 0;
    let Start = Date.now();

    let wishPlanResults = {};
    for (const i of WishConfig.wishPlanMapper) {
        if (WishConfig[`WishPlanEnabled${i}`]) {
            wishPlanResults[i] = 0;
        }
    }

    let TrialCount;
    for (TrialCount = 0; TrialCount < Trials; TrialCount++) {

        Lost5050s = 0
        Wishes = 0;

        CharacterPity = WishConfig.CharacterPity;
        CharacterGuarantee = WishConfig.CharacterGuarantee;
        CharacterRate = 0.006 + Math.max(0, .06*(CharacterPity-73));
        
        if (WishConfig.EnableCapturingRadiance) {
            CapturingRadiancePity = WishConfig.CapturingRadiancePity;
        }

        WeaponPity = WishConfig.WeaponPity;
        WeaponGuarantee = WishConfig.WeaponGuarantee;
        WeaponFatePoints = WishConfig.WeaponFatePoints;
        WeaponRate = 0.007 + Math.max(.07*(WeaponPity-61), 0);

        ChronicledPity = WishConfig.ChronicledPity;
        ChronicledFatePoints = WishConfig.ChronicledFatePoints;
        ChronicledRate = 0.006 + Math.max(0, .06*(ChronicledPity-73));


        if (WishConfig.WishMode != WishModes.ADVANCED.value) {
            let Characters = CharacterWishSim(WishConfig, WishConfig.CharacterGoal, WishConfig.MaxWishes);

            let Weapons = WeaponWishSim(WishConfig, WishConfig.WeaponGoal, WishConfig.MaxWishes);

            let ChronicledItems = ChronicledWishSim(WishConfig, WishConfig.ChronicledGoal, WishConfig.MaxWishes);

            if (Characters >= WishConfig.CharacterGoal && Weapons >= WishConfig.WeaponGoal && ChronicledItems >= WishConfig.ChronicledGoal) {
                Successes++;
            }
            
        }
        else {
            let First = true
            let WishGroupMaxWishes = 0
            let MissedFiveStars = false;
            for (const i of WishConfig.wishPlanMapper) {
                if (WishConfig[`WishPlanEnabled${i}`]) {
                    if (WishGroupMaxWishes != WishConfig[`WishPlanMaxWishes${i}`]) {
                        WishGroupMaxWishes = WishConfig[`WishPlanMaxWishes${i}`];

                        if (!First) {
                            WeaponFatePoints = 0;
                            ChronicledFatePoints = 0;
                        }
                        First = false;
                    };

                    let WishItemsWon;
                    switch (WishConfig[`WishPlanType${i}`]) {
                        case BannerTypeDropdownOptions['CHARACTER'].value:
                            WishItemsWon = CharacterWishSim(WishConfig, WishConfig[`WishPlanGoal${i}`], WishConfig[`WishPlanMaxWishes${i}`]);
                            break;
                        case BannerTypeDropdownOptions['WEAPON'].value: 
                            WishItemsWon = WeaponWishSim(WishConfig, WishConfig[`WishPlanGoal${i}`], WishConfig[`WishPlanMaxWishes${i}`]);
                            break;
                        case BannerTypeDropdownOptions['CHRONICLED_WISH'].value: 
                            WishItemsWon = ChronicledWishSim(WishConfig, WishConfig[`WishPlanGoal${i}`], WishConfig[`WishPlanMaxWishes${i}`]);
                            break;
                    };

                    if (WishItemsWon >= WishConfig[`WishPlanGoal${i}`]) {
                        wishPlanResults[i]++;
                    }
                    else {
                        MissedFiveStars = true;
                    }
                };
            };

            if (MissedFiveStars == false) {
                Successes++
            };
        }

        if (Date.now() - Start > 5000) {
            TrialCount += 1
            break;
        }
    }

    for (const i of WishConfig.wishPlanMapper) {
        if (WishConfig[`WishPlanEnabled${i}`]) {
            wishPlanResults[i] = ((wishPlanResults[i] / TrialCount)*100).toFixed(1)+'%';
        };
    };

    return ({
        TotalSuccessRate: ((Successes / TrialCount)*100).toFixed(1)+'%', 
        wishPlanResults: wishPlanResults
    });
};

function CharacterWishSim(WishConfig, CharacterGoal, MaxWishes) {
    let Characters = 0;

    while (Characters < CharacterGoal && Wishes < MaxWishes) {
        Wishes++;
        CharacterPity++;

        if (CharacterPity >= 74) {
            CharacterRate += 0.06;
        }

        if (Math.random() <= CharacterRate) {
            CharacterRate = 0.006;
            CharacterPity = 0;

            if (!WishConfig.EnableCapturingRadiance) {
                NonGuaranteeCharacterWinChance = 0.500
            }
            else {  
                switch (CapturingRadiancePity) {
                    case 0: NonGuaranteeCharacterWinChance = 0.500; break;
                    case 1: NonGuaranteeCharacterWinChance = 0.525; break;
                    case 2: NonGuaranteeCharacterWinChance = 0.750; break;
                    case 3: NonGuaranteeCharacterWinChance = 1.000; break;
                };
            };

            if (CharacterGuarantee || (Math.random() < NonGuaranteeCharacterWinChance)) {
                if (!CharacterGuarantee) {
                    CapturingRadiancePity = 0;
                }

                Characters++;
                CharacterGuarantee = 0;
            } else {
                CharacterGuarantee = 1;
                Lost5050s++;
                CapturingRadiancePity++;

                if ( WishConfig.UsingStarglitter && (Lost5050s > WishConfig.MissingFiveStars) ){
                    Wishes -= 2 // You get enough starglitter from five star cons to make two additional wishes.
                }
            }
        }
    }

    return Characters;
}

function WeaponWishSim(WishConfig, WeaponGoal, MaxWishes) {
    let Weapons = 0;

    while (Weapons < WeaponGoal && Wishes < MaxWishes) {
        Wishes++;
        WeaponPity++;

        if (WeaponPity >= 63) {
            WeaponRate += 0.07;
        }

        if (Math.random() <= WeaponRate) {
            WeaponRate = 0.007;
            WeaponPity = 0;

            if (WishConfig.UsingStarglitter) {
                Wishes -= 2 // You get enough starglitter from five stars to make two additional wishes.
            }

            let r = Math.random();

            if (WeaponFatePoints === 1 || (WeaponGuarantee && r <= 0.5) || (r <= 0.375)) {
                Weapons++;
                WeaponGuarantee = 0;
                WeaponFatePoints = 0;
            } else if (WeaponGuarantee || (r <= 0.75)) {
                WeaponGuarantee = 0;
                WeaponFatePoints++;
            } else {
                WeaponGuarantee = 1;
                WeaponFatePoints++;
            }
        }
    }

    return Weapons;
}

function ChronicledWishSim(WishConfig, ChronicledGoal, MaxWishes) {
    let ChronicledItems = 0;

    while (ChronicledItems < ChronicledGoal && Wishes < MaxWishes) {
        Wishes++;
        ChronicledPity++;

        if (ChronicledPity >= 74) {
            ChronicledRate += 0.06;
        }

        if (Math.random() <= ChronicledRate) {
            ChronicledRate = 0.006;
            ChronicledPity = 0;

            if (ChronicledFatePoints >= 1 || (Math.random() < 0.5)) {
                ChronicledItems++;
                ChronicledFatePoints = 0;
            } else {
                ChronicledFatePoints++;
            }
        }
    }

    return ChronicledItems;
}

function WishCalcs(WishConfig) {
    if (WishConfig.WishMode != WishModes.ADVANCED.value) {

        LastBannerInfo = BannerInfo[WishConfig.BannerEnd];

        if (WishConfig.WishMode != WishModes.SIMPLE.value) {
            // While the Banner End dropdown should prevent the user from selecting an end date that is in the past, we will leave it here for any edge cases that may occur.
            if (LastBannerInfo.BannerEndDate < Today) {
                $('#WishError').show().html('Banner has already ended.');
                return {Success: false}
            }
            
            $('#WishEndDate').show().html(`Wishing End Date: ${moment(LastBannerInfo.BannerEndDate, "YYYY-MM-DD").format('L')}`);
        }

        WishConfig.MaxWishes = SavingsCalculator(WishConfig);

        $('#MaxWishes').show().html(`Max Number of Wishes: ${WishConfig.MaxWishes}`);

        let WishingFor = `Wishing for ${WishConfig.CharacterGoal} characters, ${WishConfig.WeaponGoal} weapons, and ${WishConfig.ChronicledGoal} chronicled items.`;

        $('#WishingGoals').show().html(WishingFor);

        $('#Chance').show().html(`Chances of reaching wish goals: ${NumericWishCalculations(WishConfig).TotalSuccessRate}`);

        return {Success: true}
    }
    else {
        let ixBannerEnd = -1;
        let ixMaxWishes;
        for (const i of WishConfig.wishPlanMapper) {
            if (WishConfig[`WishPlanEnabled${i}`]) {
                if (WishConfig[`WishPlanBannerEnd${i}`] > ixBannerEnd) {
                    ixBannerEnd = WishConfig[`WishPlanBannerEnd${i}`];
                    LastBannerInfo = BannerInfo[ixBannerEnd];

                    WishConfig[`WishPlanMaxWishes${i}`] = SavingsCalculator(WishConfig);
                    ixMaxWishes = WishConfig[`WishPlanMaxWishes${i}`]
                }
                else if (WishConfig[`WishPlanBannerEnd${i}`] == ixBannerEnd) {
                    WishConfig[`WishPlanMaxWishes${i}`] = ixMaxWishes
                }
                else {
                    $('#WishError').show().html('Banner end dates must be in ascending order.');
                    return {Success: false};
                };
            };
        };

        wishResults = NumericWishCalculations(WishConfig);

        $('#WishPlanningResultsTable .WishPlanResultsRow').remove();

        for (const i of WishConfig.wishPlanMapper) {
            if (WishConfig[`WishPlanEnabled${i}`]) {
                let BannerEndVal = WishConfig[`WishPlanBannerEnd${i}`]
                let BannerEndText = $(`#BannerEnd option[value=${BannerEndVal}]`).text();

                let newRow = $(
                    `<tr class="WishPlanResultsRow">`+
                        `<td>${WishConfig[`WishPlanItem${i}`]}</td>`+
                        `<td>${BannerEndText}</td>`+
                        `<td>${WishConfig[`WishPlanGoal${i}`]}</td>`+
                        `<td>${WishConfig['WishPlanMaxWishes'+i]}</td>`+
                        `<td>${wishResults.wishPlanResults[i]}</td>`+
                    `</tr>`
                );

                $('#WishPlanningResultsBody').append(newRow);
            };
        };

        $('#WishPlanningResultsTable tfoot').append($(
            `<tr class="WishPlanResultsRow">`+
                `<td colspan="5"><b>Chances of reaching all wish goals: ${wishResults.TotalSuccessRate}</b></td>`+
            `</tr>`
        ));

        $('#WishPlanningResultsTable').show();

        return {Success: true}
    };
}