param([int]$StartYear=2026,[int]$EndYear=2035,[string]$OutputFile="js/tide-data.js")
$ErrorActionPreference="Stop"
$samples=[System.Collections.Generic.List[object]]::new()
for($year=$StartYear;$year -le $EndYear;$year++){
  for($month=1;$month -le 12;$month++){
    $start=Get-Date -Date ("{0:D4}-{1:D2}-01 00:00:00" -f $year,$month);$end=$start.AddMonths(1)
    $min=[uri]::EscapeDataString($start.ToString("yyyy-MM-dd HH:mm:ss"));$max=[uri]::EscapeDataString($end.ToString("yyyy-MM-dd HH:mm:ss"))
    $uri="https://webcritech.jrc.ec.europa.eu/SeaLevelsDb/api/Device/2052/Data?tMin=$min&tMax=$max&nPts=9000&field=tide"
    Write-Host ("Downloading Casablanca tide model: {0:yyyy-MM}" -f $start)
    foreach($item in (Invoke-RestMethod -Uri $uri)){$samples.Add([pscustomobject]@{Date=[datetime]::SpecifyKind([datetime]$item.Date,[DateTimeKind]::Utc);Value=[double]$item.Value})}
  }
}
$samples=$samples|Sort-Object Date -Unique;$events=[System.Collections.Generic.List[object]]::new()
for($i=1;$i -lt $samples.Count-1;$i++){
  $p=$samples[$i-1].Value;$c=$samples[$i].Value;$n=$samples[$i+1].Value
  $type=if($c-le $p-and $c-lt $n){"L"}elseif($c-ge $p-and $c-gt $n){"H"}else{$null}
  if($type){$epoch=[DateTimeOffset]$samples[$i].Date;$events.Add(@([long]$epoch.ToUnixTimeSeconds(),[math]::Round($c,3),$type))}
}
$json=ConvertTo-Json -InputObject $events -Compress
$header="/* Casablanca harmonic tide extrema (UTC). JRC station 2052. Generated; run tools/generate-tides.ps1 to renew. */`nwindow.AIN_TIDE_EXTREMES=$json;`n"
[IO.File]::WriteAllText((Join-Path (Get-Location) $OutputFile),$header,[Text.UTF8Encoding]::new($false))
Write-Host "Wrote $($events.Count) tide extrema to $OutputFile"
