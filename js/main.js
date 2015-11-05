var urlBase = "http://localhost:8080/";

var populateTable = function( matches ) {
	// Get the table.
	var scoresTable = $( "table#tableScores" );
	// Remove the previous info.
	scoresTable.find( 'tr:gt(0)' ).remove();

	var playerId = parseInt( $('#players').val() );
	console.log( playerId );

	for ( var i = 0; i < matches.length; i++ ) {
		var match = matches[i];
		// Create the class to add.
		var outcomeClass;

		// If the outcome is win, add winningMatch class.
		if ( "win" === match.outcome )
			outcomeClass = "winningMatch";
		// If the outcome is lose, add losingMatch class.
		else if ( "loss" === match.outcome )
			outcomeClass = "losingMatch";
		// Otherwise, it's a tie, add tyingMatch class.
		else
			outcomeClass = "tyingMatch";

		if ( match.invalid )
			outcomeClass = [ outcomeClass, "invalidMatch" ].join(" ");

		match.playerNames.splice( match.players.indexOf(playerId), 1 );

		// Build the html.
		var html = [
			'<tr id="',match.gameId,'" class="match ',outcomeClass,'">',
				"<td>",match.datePlayed,"</td >",
				"<td>",match.playerNames.join("-"),"</td>",
				"<td>",match.playerScores.join("-"),"</td>",
				"<td>",match.location,"</td>",
			"</tr>"
		].join("");

		// Append the html to the table.
		scoresTable.append( html );
	}

	// Now that we've changed the scores, re-calculate the win percentage.
	calculateWinPercentage();
};

var populatePlayers = function( players, field ) {
	var playersSelect = $( '#' + field );
	// Remove the previous options.
	playersSelect.find( 'option' ).remove();
	// If the field to modify is players, add "Choose..." to the list.
	if ( "players" === field ) players.unshift( { id : "choose", name : "Choose..." } );
	// Otherwise, add "all" to the list.
	else players.unshift( { id: "all", name : "All" } );


	// Loop through the array.
	for ( var i = 0; i < players.length; i++ ) {
		// Add an option for each player, with the option's value as the player's id and the inner text as the player's name.
		var html = [ "<option value=", players[i].id, ">", players[i].name, "</option>"].join("");
		// Append the html to the select element.
		playersSelect.append( html );
	}
};

var calculateWinPercentage = function() {
	// Get the winpct span.
	var winSpan = $('#winpct');
	// Get the toggle valid button.
	var validBtn = $('#toggleValidBtn' );
	// Valid is the value of the button.
	var valid = validBtn.val();
	// Set the percentage of wins to 0.
	var winPct = 0;
	// Do we only want valid wins?
	if ( "valid" === valid )
		// Yes. winPct is the ratio of table rows that are winning non-invalid matches to table rows that are matches that are not invalid matches.
		winPct = $('tr.winningMatch').not('tr.invalidMatch').length / $('tr.match').not('tr.invalidMatch').length;
	else
		// No. winPct is the ratio of table rows that are winning matches to table rows that are matches.
		winPct = $('tr.winningMatch' ).length / $('tr.match').length;
	// Is the winPct not a number?
	if ( isNaN(winPct) )
		// Yes. There are no valid matches.
		winPct = 'No valid matches.';
	else
		// No. Make it a percentage and round it off, join a percentage symbol.
		winPct = [ Math.round(winPct*100), "%" ].join("");
	// Set the winSpan's text.
	winSpan.text( "Win Percentage: " + winPct );
	// Enable the valid button.
	validBtn.prop("disabled",false);
};

var getPlayers = function() {
	// Get the players.
	$.ajax( { url: urlBase + "players" } )
		.done( function( data ) {
			// Populate the players list.
			populatePlayers( data, "players" );
		})
		.fail( function( err ) {
			handleError( err );
		});
};

var getPlayerMatches = function( data ) {
	// Set the value of the data.
	var value = data.value;
	// Is the value "choose"?
	if ( value !== "choose" ) {
		// Yes. Make the ajax call to get the player's matches.
		$.ajax({url:urlBase+"players/"+value+"/matches"})
			.done( function( data ) {
				// Now populate the table.
				populateTable( data );
			})
			.fail( function( err ) {
				handleError( err );
			});
	}
};

var getPlayerOpponents = function( data ) {
	// Set the value of the data.
	var value = data.value;
	// Is the value "choose"?
	if ( value !== "choose" ) {
		// Yes. Make the ajax call to get the player's opponents.
		$.ajax({url:urlBase+"players/"+value+"/opponents"})
			.done( function ( data ) {
				// Now populate the opponents list..
				populatePlayers( data, "opponents" );
			})
			.fail( function( err ) {
				handleError( err );
			});
	}
};

var getPlayerVersus = function( data ) {
	// Get the data value.
	var value = data.value;
	// Get the player id.
	var playerId = $('#players').val();
	// Is the value not "all" and not "none"?
	if ( value !== "all" && value !== "none" ) {
		// Yes. Call to get the matches between player and opponent.
		$.ajax({url:urlBase+"players/"+playerId+"/versus/"+value})
			.done( function( data ) {
				// Populate the table upon completion.
				populateTable( data );
			})
			.fail( function( err ) {
				handleError( err );
			});
	}
	else {
		// No. Get the player against all.
		getPlayerMatches( { value : playerId } );
	}
};

var toggleValidBtn = function() {
	// Get the toggle button.
	var toggleBtn = $('#toggleValidBtn');
	// Does the value = "all"?
	if ( toggleBtn.attr( 'value' ) === "all" ) {
		// Yes. Switch the value to valid.
		toggleBtn.val( "valid" );
		// Change the text.
		toggleBtn.text( "Toggle to: All Matches" );
	}
	else {
		// No. Switch the value to all.
		toggleBtn.val( "all" );
		// Change the text.
		toggleBtn.text( "Toggle to: Valid Matches Only" );
	}

	// We've changed the validity. Recalculate the win percentage.
	calculateWinPercentage();
};

var handleError = function( err ) {
	alert( "Oops! We encountered an error: " + JSON.stringify( err ) );
};

$(document).ready(function(){
	// Page is loaded, let's get the players.
	getPlayers();
});

$( function() {
	// Make these functions available.

	// When the players select element changes.
	$('#players').change( function() {
		// Get the player's matches.
		getPlayerMatches( this );
		// Get the player's opponents.
		getPlayerOpponents( this );
	} );
	// When the opponents select element changes.
	$('#opponents' ).change( function() {
		// Get the player's versus matches.
		getPlayerVersus( this );
	});
	// When the toggle valid button is clicked.
	$('#toggleValidBtn' ).click( function() {
		// toggle the Valid button.
		toggleValidBtn();
	});
});

